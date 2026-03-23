import React, { useEffect, useState } from 'react';
import { message } from 'antd';
import type { TableProps } from 'antd';
import Header from '../../components/Header';
import Announcement from '../../components/Announcement';
import FilterBar from '../../components/FilterBar';
import type { FilterValues } from '../../components/FilterBar';
import ProductTable from './ProductTable';
import ProductCardList from './ProductCard';
import {
  getConfig,
  getProducts,
  getApiErrorMessage,
} from '../../api';
import type {
  FrontendConfig,
  Product,
  ProductListParams,
} from '../../api';

interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
}

interface SorterState {
  field?: string;
  order?: 'asc' | 'desc';
}

const Home: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [config, setConfig] = useState<FrontendConfig | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    current: 1,
    pageSize: 50,
    total: 0,
  });
  const [filters, setFilters] = useState<FilterValues>({});
  const [sorter, setSorter] = useState<SorterState>({});
  const currentPage = pagination.current;
  const currentPageSize = pagination.pageSize;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadConfig = async () => {
      try {
        const res = await getConfig();
        if (!cancelled && res.data.code === 0) {
          setConfig(res.data.data || null);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          message.error(getApiErrorMessage(error) || 'Failed to load site config');
        }
      }
    };

    void loadConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      setLoading(true);

      try {
        const params: ProductListParams = {
          page: currentPage,
          pageSize: currentPageSize,
          ...filters,
        };

        if (sorter.field && sorter.order) {
          params.sortField = sorter.field;
          params.sortOrder = sorter.order;
        }

        const res = await getProducts(params);
        if (cancelled) {
          return;
        }

        if (res.data.code === 0 && res.data.data) {
          setProducts(res.data.data.list);
          setPagination((prev) => ({
            ...prev,
            total: res.data.data?.total || 0,
          }));
        } else {
          message.error(res.data.message || 'Failed to load products');
        }
      } catch (error: unknown) {
        if (!cancelled) {
          message.error(getApiErrorMessage(error) || 'Failed to request products');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, [currentPage, currentPageSize, filters, sorter]);

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleTableChange: TableProps<Product>['onChange'] = (nextPagination, _filters, sort) => {
    const nextSort = Array.isArray(sort) ? sort[0] : sort;

    setPagination((prev) => ({
      ...prev,
      current: nextPagination.current ?? 1,
      pageSize: nextPagination.pageSize ?? prev.pageSize,
    }));

    if (nextSort?.columnKey && nextSort.order) {
      setSorter({
        field: String(nextSort.columnKey),
        order: nextSort.order === 'ascend' ? 'asc' : 'desc',
      });
    } else {
      setSorter({});
    }
  };

  const handleCardSortChange = (field: string, order: 'ascend' | 'descend' | undefined) => {
    setSorter({
      field: field || undefined,
      order: order === 'ascend' ? 'asc' : order === 'descend' ? 'desc' : undefined,
    });
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleCardPageChange = (page: number, pageSize: number) => {
    setPagination((prev) => ({
      ...prev,
      current: page,
      pageSize,
    }));
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', paddingBottom: 40 }}>
      <Header config={config} />
      <Announcement config={config} />
      <FilterBar onFilterChange={handleFilterChange} />

      {isMobile ? (
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
    </div>
  );
};

export default Home;
