import React from 'react';
import { Table, Tooltip, Button, Typography, Tag } from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { QuestionCircleOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import type { Product } from '../../api';

const { Text } = Typography;

interface ProductTableProps {
  data: Product[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  onChange: TableProps<Product>['onChange'];
}

const ProductTable: React.FC<ProductTableProps> = ({ data, loading, pagination, onChange }) => {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const columns: ColumnsType<Product> = [
    {
      title: t('table.provider'),
      dataIndex: 'provider',
      key: 'provider',
      width: 100,
      render: (text) => <Tag color="blue" style={{ borderRadius: 6, fontWeight: 600, padding: '2px 10px' }}>{text}</Tag>
    },
    {
      title: t('table.name'),
      dataIndex: 'name',
      key: 'name',
      width: 150,
      ellipsis: true,
      render: (text) => <Text strong style={{ color: '#475569' }}>{text}</Text>
    },
    {
      title: t('table.cpu'),
      dataIndex: 'cpu',
      key: 'cpu',
      sorter: true,
      width: 80,
      render: (val: number) => (
        <Text style={{ fontSize: 13 }}>{val} {t('table.cpuUnit')}</Text>
      ),
    },
    {
      title: t('table.memory'),
      dataIndex: 'memory',
      key: 'memory',
      sorter: true,
      width: 80,
      render: (val: number) => (
        <Text style={{ fontSize: 13 }}>{val} {t('table.memoryUnit')}</Text>
      ),
    },
    {
      title: t('table.disk'),
      dataIndex: 'disk',
      key: 'disk',
      sorter: true,
      width: 80,
      render: (val: number) => (
        <Text style={{ fontSize: 13 }}>{val} {t('table.diskUnit')}</Text>
      ),
    },
    {
      title: t('table.monthlyTraffic'),
      dataIndex: 'monthlyTraffic',
      key: 'monthlyTraffic',
      width: 100,
      sorter: true,
      render: (val: number) => (
        <Tag color="cyan">
          {(val / 1000).toFixed(2)} TB
        </Tag>
      ),
    },
    {
      title: t('table.bandwidth'),
      dataIndex: 'bandwidth',
      key: 'bandwidth',
      width: 100,
      sorter: true,
      render: (val: number) => (
          <Text strong style={{ color: '#0ea5e9' }}>{(val / 1000).toFixed(2)} Gbps</Text>
      ),
    },
    {
      title: t('table.location'),
      dataIndex: 'location',
      key: 'location',
      width: 80,
    },
    {
      title: (
        <span>
          {t('table.price')}
          <Tooltip title={t('table.priceSortTip')}>
            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'price',
      key: 'price',
      width: 120,
      sorter: true,
      render: (val: number, record: Product) => (
        <span style={{ fontSize: 16, fontWeight: 700, color: '#4f46e5' }}>
          {val.toFixed(2)} {record.currency}
        </span>
      ),
    },
    {
      title: t('table.order'),
      key: 'order',
      width: 100,
      render: (_, record: Product) => (
        <Button 
          type="primary" 
          href={record.affiliateUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          icon={<ShoppingCartOutlined />}
          style={{ 
            borderRadius: 8, 
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            border: 'none',
            boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)'
          }}
        >
          {t('table.orderButton')}
        </Button>
      ),
    },
  ];

  return (
    <div className="glass-panel" style={{ 
      padding: isMobile ? 12 : 24, 
      borderRadius: 20, 
      margin: isMobile ? '0 12px 24px' : '0 24px 24px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
      overflow: 'hidden'
    }}>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          pageSizeOptions: ['20', '50', '100'],
          showTotal: (total) => t('table.total', { total }),
          position: ['bottomCenter'],
        }}
        onChange={onChange}
        scroll={{ x: 'max-content' }}
        className="modern-table"
        onRow={(_, index) => ({
          className: `stagger-item stagger-delay-${((index ?? 0) % 10) + 1}`
        })}
      />
    </div>
  );
};

export default ProductTable;

