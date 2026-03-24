import React, { useEffect, useState, useCallback } from 'react';
import { message } from 'antd';
import type { TableProps } from 'antd';
import Header from '../../components/Header';
import Announcement from '../../components/Announcement';
import FilterBar from '../../components/FilterBar';
import type { FilterValues } from '../../components/FilterBar';
import ProductTable from './ProductTable';
import ProductCardList from './ProductCard';
import ProductSkeleton from './ProductSkeleton';
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
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
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
  
  const isSmallScreen = windowWidth < 1200;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
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

  const loadProducts = useCallback(async (cancelled: { current: boolean }) => {
    setLoading(true);

    try {
      const params: ProductListParams = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
      };

      if (sorter.field && sorter.order) {
        params.sortField = sorter.field;
        params.sortOrder = sorter.order;
      }

      const res = await getProducts(params);
      if (cancelled.current) return;

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
      if (!cancelled.current) {
        message.error(getApiErrorMessage(error) || 'Failed to request products');
      }
    } finally {
      if (!cancelled.current) {
        setLoading(false);
      }
    }
  }, [pagination.current, pagination.pageSize, filters, sorter]);

  useEffect(() => {
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
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Dynamic Background */}
      <div className="interactive-bg" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
        pointerEvents: 'none'
      }}>
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '50%',
          height: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          animation: 'float 15s infinite ease-in-out'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '5%',
          left: '-5%',
          width: '40%',
          height: '40%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(70px)',
          animation: 'float 18s infinite ease-in-out reverse'
        }} />
      </div>

      <Header config={config} />
      <Announcement config={config} />
      
      <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1, padding: isSmallScreen ? '0 12px' : '0 24px' }}>
        <FilterBar onFilterChange={handleFilterChange} />

        {loading ? (
          <ProductSkeleton viewMode={isSmallScreen ? 'card' : 'table'} />
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
      </div>
    </div>
  );
};

export default Home;

