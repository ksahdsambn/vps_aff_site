import React from 'react';
import { Table, Tooltip, Button, Typography } from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { QuestionCircleOutlined, ShoppingCartOutlined, ExportOutlined } from '@ant-design/icons';
import type { Product } from '../../api';

const { Text, Link } = Typography;

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
    },
    {
      title: t('table.name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('table.cpu'),
      dataIndex: 'cpu',
      key: 'cpu',
      sorter: true,
      render: (val: number) => `${val} ${t('table.cpuUnit')}`,
    },
    {
      title: t('table.memory'),
      dataIndex: 'memory',
      key: 'memory',
      sorter: true,
      render: (val: number) => `${val} ${t('table.memoryUnit')}`,
    },
    {
      title: t('table.disk'),
      dataIndex: 'disk',
      key: 'disk',
      sorter: true,
      render: (val: number) => `${val} ${t('table.diskUnit')}`,
    },
    {
      title: t('table.monthlyTraffic'),
      dataIndex: 'monthlyTraffic',
      key: 'monthlyTraffic',
      sorter: true,
      render: (val: number) => `${(val / 1000).toFixed(2)} TB`,
    },
    {
      title: t('table.bandwidth'),
      dataIndex: 'bandwidth',
      key: 'bandwidth',
      sorter: true,
      render: (val: number) => `${(val / 1000).toFixed(2)} Gbps`,
    },
    {
      title: t('table.location'),
      dataIndex: 'location',
      key: 'location',
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
      sorter: true,
      render: (val: number, record: Product) => `${val.toFixed(2)} ${record.currency}`,
    },
    {
      title: t('table.review'),
      dataIndex: 'reviewUrl',
      key: 'reviewUrl',
      render: (url: string | null) => 
        url ? (
          <Link href={url} target="_blank" rel="noopener noreferrer">
            {t('table.reviewLink')} <ExportOutlined />
          </Link>
        ) : (
          <Text type="secondary">{t('table.noReview')}</Text>
        ),
    },
    {
      title: t('table.remark'),
      dataIndex: 'remark',
      key: 'remark',
      render: (remark: string | null) => 
        remark ? <Text>{remark}</Text> : <Text type="secondary">{t('table.noRemark')}</Text>,
    },
    {
      title: t('table.order'),
      key: 'order',
      fixed: 'right',
      render: (_, record: Product) => (
        <Button 
          type="primary" 
          href={record.affiliateUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          icon={<ShoppingCartOutlined />}
        >
          {t('table.orderButton')}
        </Button>
      ),
    },
  ];

  return (
    <div style={{ backgroundColor: '#fff', padding: isMobile ? 8 : 16, borderRadius: 8, margin: isMobile ? '0 12px 24px' : '0 24px 24px' }}>
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
        }}
        onChange={onChange}
        scroll={{ x: 1200 }}
      />
    </div>
  );
};

export default ProductTable;
