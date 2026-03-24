import React from 'react';
import { Card, Button, Typography, Pagination, Select, Row, Col, Divider, Tooltip, Empty, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { ShoppingCartOutlined, ExportOutlined, QuestionCircleOutlined, CloudServerOutlined, RocketOutlined, DatabaseOutlined, GlobalOutlined, ThunderboltOutlined, InteractionOutlined } from '@ant-design/icons';
import type { Product } from '../../api';
import styles from './ProductCard.module.css';
import VpsProgress from './VpsProgress';

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
        <span className={styles.sortLabel}><InteractionOutlined style={{marginRight: 8}}/>{t('sort.label')}</span>
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

      {data.length === 0 && !loading ? (
        <div style={{ padding: '60px 0', background: 'rgba(255,255,255,0.4)', borderRadius: 20, backdropFilter: 'blur(10px)' }}>
          <Empty description={t('table.noData')} />
        </div>
      ) : (
        <div className={styles.cardList}>
          {data.map((item, index) => (
            <Card key={item.id} className={`${styles.card} stagger-item stagger-delay-${(index % 10) + 1}`} styles={{ body: { padding: 20 } }}>
              <div className={styles.cardHeader}>
                <Tag color="blue" style={{ borderRadius: 6, fontWeight: 700 }}>{item.provider}</Tag>
                <div className={styles.price}>
                  {item.price.toFixed(2)} {item.currency} 
                  <Tooltip title={t('table.priceSortTip')}><QuestionCircleOutlined style={{fontSize: 14, marginLeft: 8, color: '#94a3b8'}}/></Tooltip>
                </div>
              </div>
              <div className={styles.name}>{item.name}</div>
              
              <Divider style={{ margin: '16px 0', borderColor: 'rgba(0,0,0,0.04)' }} />
              
              <Row gutter={[16, 16]} className={styles.details}>
                <Col span={12}>
                  <div style={{ marginBottom: 12 }}>
                    <Text type="secondary" style={{ fontSize: 13 }}><CloudServerOutlined style={{marginRight: 6}}/>{t('table.cpu')}:</Text>
                    <div style={{fontWeight: 700, marginBottom: 4}}>{item.cpu} {t('table.cpuUnit')}</div>
                    <VpsProgress value={item.cpu} max={16} color="#6366f1" />
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: 12 }}>
                    <Text type="secondary" style={{ fontSize: 13 }}><RocketOutlined style={{marginRight: 6}}/>{t('table.memory')}:</Text>
                    <div style={{fontWeight: 700, marginBottom: 4}}>{item.memory} {t('table.memoryUnit')}</div>
                    <VpsProgress value={item.memory} max={32768} color="#8b5cf6" />
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: 12 }}>
                    <Text type="secondary" style={{ fontSize: 13 }}><DatabaseOutlined style={{marginRight: 6}}/>{t('table.disk')}:</Text>
                    <div style={{fontWeight: 700, marginBottom: 4}}>{item.disk} {t('table.diskUnit')}</div>
                    <VpsProgress value={item.disk} max={1024} color="#ec4899" />
                  </div>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{fontSize: 13}}><InteractionOutlined style={{marginRight: 6}}/>{t('table.monthlyTraffic')}:</Text> 
                  <div style={{fontWeight: 600}}>{(item.monthlyTraffic / 1000).toFixed(2)} TB</div>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{fontSize: 13}}><ThunderboltOutlined style={{marginRight: 6}}/>{t('table.bandwidth')}:</Text> 
                  <div style={{fontWeight: 600}}>{(item.bandwidth / 1000).toFixed(2)} Gbps</div>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{fontSize: 13}}><GlobalOutlined style={{marginRight: 6}}/>{t('table.location')}:</Text> 
                  <div style={{fontWeight: 600}}>{item.location}</div>
                </Col>
              </Row>
              
              <Divider style={{ margin: '16px 0', borderColor: 'rgba(0,0,0,0.04)' }} />

              {item.remark && (
                <div className={styles.remark}>
                  <Text type="secondary" style={{fontSize: 12, display: 'block', marginBottom: 4}}>{t('table.remark')}:</Text> 
                  <Text style={{ fontSize: 13 }}>{item.remark}</Text>
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
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', 
                    border: 'none',
                    height: 48,
                    borderRadius: 12,
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
                  }}
                >
                  {t('table.orderButton')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

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

