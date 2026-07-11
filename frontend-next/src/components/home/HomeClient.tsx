"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { message } from "antd";
import type { TableProps } from "antd";
import FilterBar, { type FilterValues } from "@/components/FilterBar";
import ProductTable from "./ProductTable";
import ProductCardList from "./ProductCard";
import ProductSkeleton from "./ProductSkeleton";
import {
  getProducts,
  getApiErrorMessage,
  type Product,
  type GetProductsParams,
} from "@/lib/api";

interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
}

interface SorterState {
  field?: string;
  order?: "asc" | "desc";
}

interface HomeClientProps {
  /** 服务端 SSG 预取的初始产品数据（首帧内容，爬虫可见）。 */
  initialProducts: Product[];
  initialTotal: number;
  /** 服务端预取的服务商列表。 */
  initialProviders: string[];
  locale: "zh" | "en";
}

/**
 * 首页客户端 island。
 *
 * 首帧：直接渲染 initialProducts（来自服务端 SSG），无需加载、无骨架屏闪烁。
 * 交互：筛选/排序/分页时调用 getProducts() 重新拉取，期间显示骨架屏。
 */
const HomeClient: React.FC<HomeClientProps> = ({
  initialProducts,
  initialTotal,
  initialProviders,
  locale,
}) => {
  const { t } = useTranslation();
  const [windowWidth, setWindowWidth] = useState(1200);
  // 首帧用 SSG 预取数据，loading=false（消除骨架屏闪烁）
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    current: 1,
    pageSize: 50,
    total: initialTotal,
  });
  const [filters, setFilters] = useState<FilterValues>({});
  const [sorter, setSorter] = useState<SorterState>({});

  const isSmallScreen = windowWidth < 1200;

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadProducts = useCallback(
    async (cancelled: { current: boolean }) => {
      setLoading(true);
      try {
        const params: GetProductsParams = {
          page: pagination.current,
          pageSize: pagination.pageSize,
          ...filters,
        };
        if (sorter.field && sorter.order) {
          params.sortField = sorter.field;
          params.sortOrder = sorter.order;
        }
        const data = await getProducts(params);
        if (cancelled.current) return;
        setProducts(data.list);
        setPagination((prev) => ({ ...prev, total: data.total }));
      } catch (error) {
        if (!cancelled.current) {
          message.error(getApiErrorMessage(error) || t("common.networkError"));
        }
      } finally {
        if (!cancelled.current) setLoading(false);
      }
    },
    [pagination.current, pagination.pageSize, filters, sorter, t]
  );

  // 仅在筛选/排序/分页变化时重新拉取（首帧用 SSG 数据，不触发）
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const cancelled = { current: false };
    void loadProducts(cancelled);
    return () => {
      cancelled.current = true;
    };
  }, [loadProducts]);

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleTableChange: TableProps<Product>["onChange"] = (
    nextPagination,
    _filters,
    sort
  ) => {
    const nextSort = Array.isArray(sort) ? sort[0] : sort;
    setPagination((prev) => ({
      ...prev,
      current: nextPagination.current ?? 1,
      pageSize: nextPagination.pageSize ?? prev.pageSize,
    }));
    if (nextSort?.columnKey && nextSort.order) {
      setSorter({
        field: String(nextSort.columnKey),
        order: nextSort.order === "ascend" ? "asc" : "desc",
      });
    } else {
      setSorter({});
    }
  };

  const handleCardSortChange = (
    field: string,
    order: "ascend" | "descend" | undefined
  ) => {
    setSorter({
      field: field || undefined,
      order: order === "ascend" ? "asc" : order === "descend" ? "desc" : undefined,
    });
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleCardPageChange = (page: number, pageSize: number) => {
    setPagination((prev) => ({ ...prev, current: page, pageSize }));
  };

  // locale 仅用于骨架屏 viewMode 隔离（此处不影响渲染）
  void locale;

  return (
    <>
      <section
        aria-label={t("filter.provider")}
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
          padding: isSmallScreen ? "0 12px" : "0 24px",
        }}
      >
        <FilterBar onFilterChange={handleFilterChange} initialProviders={initialProviders} />

        {loading ? (
          <ProductSkeleton viewMode={isSmallScreen ? "card" : "table"} />
        ) : isSmallScreen ? (
          <ProductCardList
            data={products}
            loading={loading}
            pagination={pagination}
            onSortChange={handleCardSortChange}
            onPageChange={handleCardPageChange}
          />
        ) : (
          <ProductTable
            data={products}
            loading={loading}
            pagination={pagination}
            onChange={handleTableChange}
          />
        )}
      </section>
    </>
  );
};

export default HomeClient;
