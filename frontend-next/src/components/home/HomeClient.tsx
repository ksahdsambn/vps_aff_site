"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { message } from "antd";
import type { TableProps } from "antd";
import FilterBar, { type FilterValues } from "@/components/FilterBar";
import ProductTable from "./ProductTable";
import ProductCardList from "./ProductCard";
import ProductSkeleton from "./ProductSkeleton";
import GettingStarted, { type OnboardingPreset } from "./GettingStarted";
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
 *
 * 桌面表格 / 移动卡片两种视图**同时**渲染进同一份 SSG HTML，再用 CSS 媒体查询
 * （globals.css 的 .desktopOnly / .mobileOnly）按视口显隐。这样首帧 HTML 就含
 * 正确视图，避免「SSG 渲染表格 → 客户端 hydration 后才切卡片」的闪烁与横向滚动，
 * 也不再依赖 window.innerWidth（消除 hydration mismatch）。两套视图共用同一份
 * products/pagination/sort 状态，通过各自的事件回调更新（任一时刻只有一个可见）。
 */
const HomeClient: React.FC<HomeClientProps> = ({
  initialProducts,
  initialTotal,
  initialProviders,
  locale,
}) => {
  const { t } = useTranslation();
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
  const currentPage = pagination.current;
  const currentPageSize = pagination.pageSize;

  const loadProducts = useCallback(
    async (cancelled: { current: boolean }) => {
      setLoading(true);
      try {
        const params: GetProductsParams = {
          page: currentPage,
          pageSize: currentPageSize,
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
    [currentPage, currentPageSize, filters, sorter, t]
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

  const handleOnboardingStart = (preset: OnboardingPreset) => {
    const onboardingSort: Record<OnboardingPreset, SorterState> = {
      value: { field: "price", order: "asc" },
      performance: { field: "cpu", order: "desc" },
      explore: {},
    };
    setFilters({});
    setSorter(onboardingSort[preset]);
    setPagination((prev) => ({ ...prev, current: 1 }));
    window.setTimeout(() => {
      document.getElementById("vps-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  // locale 保留以便未来扩展；当前两套视图共用同一份状态，无需按 locale 区分。
  void locale;

  return (
    <>
      <GettingStarted resultCount={initialTotal} onStart={handleOnboardingStart} />
      <section
        id="vps-results"
        aria-label={t("filter.provider")}
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
          padding: "0 clamp(12px, 2vw, 24px)",
        }}
      >
        <FilterBar onFilterChange={handleFilterChange} initialProviders={initialProviders} />

        {/* 桌面表格（≥1200px）。两套视图同时存在于 SSG HTML，仅靠 CSS 显隐。 */}
        <div className="desktopOnly">
          {loading ? (
            <ProductSkeleton viewMode="table" />
          ) : (
            <ProductTable
              data={products}
              loading={loading}
              pagination={pagination}
              onChange={handleTableChange}
            />
          )}
        </div>

        {/* 移动卡片（<1200px，含平板与手机）。 */}
        <div className="mobileOnly">
          {loading ? (
            <ProductSkeleton viewMode="card" />
          ) : (
            <ProductCardList
              data={products}
              loading={loading}
              pagination={pagination}
              onSortChange={handleCardSortChange}
              onPageChange={handleCardPageChange}
            />
          )}
        </div>
      </section>
    </>
  );
};

export default HomeClient;
