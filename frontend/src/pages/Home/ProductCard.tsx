import React from 'react';
import { Card, Button, Typography, Pagination, Select, Spin, Row, Col, Divider, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { ShoppingCartOutlined, ExportOutlined, QuestionCircleOutlined } from '@ant-design/icons';
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
        />
      </div>

      <Spin spinning={loading}>
        {data.length === 0 && !loading ? (
          <div className={styles.empty}>{t('table.noData')}</div>
        ) : (
          <div className={styles.cardList}>
            {data.map((item) => (
              <Card key={item.id} className={styles.card} styles={{ body: { padding: 16 } }}>
                <div className={styles.cardHeader}>
                  <Text strong className={styles.provider}>{item.provider}</Text>
                  <Text className={styles.price}>
                    {item.price.toFixed(2)} {item.currency} 
                    <Tooltip title={t('table.priceSortTip')}><QuestionCircleOutlined style={{fontSize: 12, marginLeft: 4, color: '#bfbfbf'}}/></Tooltip>
                  </Text>
                </div>
                <div className={styles.name}>{item.name}</div>
                
                <Divider style={{ margin: '12px 0' }} />
                
                <Row gutter={[8, 8]} className={styles.details}>
                  <Col span={12}><Text type="secondary">{t('table.cpu')}:</Text> {item.cpu} {t('table.cpuUnit')}</Col>
                  <Col span={12}><Text type="secondary">{t('table.memory')}:</Text> {item.memory} {t('table.memoryUnit')}</Col>
                  <Col span={12}><Text type="secondary">{t('table.disk')}:</Text> {item.disk} {t('table.diskUnit')}</Col>
                  <Col span={12}><Text type="secondary">{t('table.monthlyTraffic')}:</Text> {(item.monthlyTraffic / 1000).toFixed(2)} TB</Col>
                  <Col span={12}><Text type="secondary">{t('table.bandwidth')}:</Text> {(item.bandwidth / 1000).toFixed(2)} Gbps</Col>
                  <Col span={12}><Text type="secondary">{t('table.location')}:</Text> {item.location}</Col>
                </Row>
                
                <Divider style={{ margin: '12px 0' }} />

                {item.remark && (
                  <div className={styles.remark}>
                    <Text type="secondary">{t('table.remark')}:</Text> <Text>{item.remark}</Text>
                  </div>
                )}
                
                <div className={styles.actions}>
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
            size="small"
            showTotal={(total) => t('pagination.total', { total })}
          />
        </div>
      )}
    </div>
  );
};

export default ProductCardList;
