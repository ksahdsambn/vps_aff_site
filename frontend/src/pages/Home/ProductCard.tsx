import React from 'react';
import { Card, Button, Typography, Pagination, Select, Spin, Row, Col, Divider, Tooltip, Empty } from 'antd';
import { useTranslation } from 'react-i18next';
import { ShoppingCartOutlined, ExportOutlined, QuestionCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import type { Product } from '../../api';
import styles from './ProductCard.module.css';

const { Text, Link } = Typography;

interface ProductCardProps {
  data: Product[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  onSortChange: (field: string, order: 'ascend' | 'descend' | undefined) => void;
  onPageChange: (page: number, pageSize: number) => void;
}

const ProductCardList: React.FC<ProductCardProps> = ({ data, loading, pagination, onSortChange, onPageChange }) => {
  const { t } = useTranslation();
  const antIcon = <LoadingOutlined style={{ fontSize: 48, color: '#6366f1' }} spin />;
  
  const handleSortChange = (value: string) => {
    if (!value) {
      onSortChange('', undefined);
      return;
    }
    const [field, order] = value.split('-');
    onSortChange(field, order as 'ascend' | 'descend');
  };

  const sortOptions = [
    { label: t('sort.default'), value: '' },
    { label: t('sort.cpuAsc'), value: 'cpu-ascend' },
    { label: t('sort.cpuDesc'), value: 'cpu-descend' },
    { label: t('sort.memoryAsc'), value: 'memory-ascend' },
    { label: t('sort.memoryDesc'), value: 'memory-descend' },
    { label: t('sort.diskAsc'), value: 'disk-ascend' },
    { label: t('sort.diskDesc'), value: 'disk-descend' },
    { label: t('sort.trafficAsc'), value: 'monthlyTraffic-ascend' },
    { label: t('sort.trafficDesc'), value: 'monthlyTraffic-descend' },
    { label: t('sort.bandwidthAsc'), value: 'bandwidth-ascend' },
    { label: t('sort.bandwidthDesc'), value: 'bandwidth-descend' },
    { label: t('sort.priceAsc'), value: 'price-ascend' },
    { label: t('sort.priceDesc'), value: 'price-descend' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.sortHeader}>
        <span className={styles.sortLabel}>{t('sort.label')}</span>
        <Select
          style={{ width: 140 }}
          placeholder={t('sort.default')}
          options={sortOptions}
          onChange={handleSortChange}
          allowClear
          size="large"
          className="glass-selector"
        />
      </div>

      <Spin spinning={loading} indicator={antIcon}>
        {data.length === 0 && !loading ? (
          <div style={{ padding: '60px 0', background: 'rgba(255,255,255,0.4)', borderRadius: 20, backdropFilter: 'blur(10px)' }}>
            <Empty description={t('table.noData')} />
          </div>
        ) : (
          <div className={styles.cardList}>
            {data.map((item) => (
              <Card key={item.id} className={styles.card} styles={{ body: { padding: 20 } }}>
                <div className={styles.cardHeader}>
                  <Text strong className={styles.provider}>{item.provider}</Text>
                  <div className={styles.price}>
                    {item.price.toFixed(2)} {item.currency} 
                    <Tooltip title={t('table.priceSortTip')}><QuestionCircleOutlined style={{fontSize: 14, marginLeft: 8, color: '#94a3b8'}}/></Tooltip>
                  </div>
                </div>
                <div className={styles.name}>{item.name}</div>
                
                <Divider style={{ margin: '16px 0', borderColor: 'rgba(0,0,0,0.04)' }} />
                
                <Row gutter={[12, 12]} className={styles.details}>
                  <Col span={12}><Text type="secondary">{t('table.cpu')}:</Text> <span style={{fontWeight: 600}}>{item.cpu} {t('table.cpuUnit')}</span></Col>
                  <Col span={12}><Text type="secondary">{t('table.memory')}:</Text> <span style={{fontWeight: 600}}>{item.memory} {t('table.memoryUnit')}</span></Col>
                  <Col span={12}><Text type="secondary">{t('table.disk')}:</Text> <span style={{fontWeight: 600}}>{item.disk} {t('table.diskUnit')}</span></Col>
                  <Col span={12}><Text type="secondary">{t('table.monthlyTraffic')}:</Text> <span style={{fontWeight: 600}}>{(item.monthlyTraffic / 1000).toFixed(2)} TB</span></Col>
                  <Col span={12}><Text type="secondary">{t('table.bandwidth')}:</Text> <span style={{fontWeight: 600}}>{(item.bandwidth / 1000).toFixed(2)} Gbps</span></Col>
                  <Col span={12}><Text type="secondary">{t('table.location')}:</Text> <span style={{fontWeight: 600}}>{item.location}</span></Col>
                </Row>
                
                <Divider style={{ margin: '16px 0', borderColor: 'rgba(0,0,0,0.04)' }} />

                {item.remark && (
                  <div className={styles.remark}>
                    <Text type="secondary" style={{fontSize: 12, display: 'block', marginBottom: 4}}>{t('table.remark')}:</Text> 
                    <Text>{item.remark}</Text>
                  </div>
                )}
                
                <div className={styles.actions} style={{ marginTop: 20 }}>
                  {item.reviewUrl ? (
                    <Link href={item.reviewUrl} target="_blank" className={styles.actionBtn}>
                      {t('table.reviewLink')} <ExportOutlined />
                    </Link>
                  ) : (
                    <Text type="secondary" className={styles.actionBtn}>{t('table.noReview')}</Text>
                  )}
                  
                  <Button 
                    type="primary"
                    size="large"
                    href={item.affiliateUrl}
                    target="_blank"
                    icon={<ShoppingCartOutlined />}
                    className={styles.orderBtn}
                    style={{ 
                      background: 'linear-gradient(to right, #6366f1, #8b5cf6)', 
                      border: 'none',
                      height: 48,
                      borderRadius: 12,
                      boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)'
                    }}
                  >
                    {t('table.orderButton')}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Spin>

      {data.length > 0 && (
        <div className={styles.pagination}>
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={onPageChange}
            showSizeChanger
            showTotal={(total) => t('pagination.total', { total })}
          />
        </div>
      )}
    </div>
  );
};

export default ProductCardList;
