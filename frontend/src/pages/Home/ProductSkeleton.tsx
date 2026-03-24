import React from 'react';
import { Card, Skeleton, Row, Col, Divider, Space } from 'antd';
import styles from './ProductCard.module.css';

interface ProductSkeletonProps {
  viewMode: 'table' | 'card';
  count?: number;
}

const ProductSkeleton: React.FC<ProductSkeletonProps> = ({ viewMode, count = 10 }) => {
  if (viewMode === 'table') {
    return (
      <div className="glass-panel" style={{ 
        padding: 24, 
        borderRadius: 16, 
        margin: '0 24px 24px',
        background: 'rgba(255,255,255,0.4)',
      }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {[...Array(count)].map((_, i) => (
            <Skeleton key={i} active paragraph={{ rows: 1 }} title={false} />
          ))}
        </Space>
      </div>
    );
  }

  return (
    <div className={styles.cardList}>
      {[...Array(count)].map((_, i) => (
        <Card key={i} className={styles.card} styles={{ body: { padding: 20 } }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Skeleton.Button active style={{ width: 100 }} />
            <Skeleton.Button active style={{ width: 80 }} />
          </div>
          <Skeleton active paragraph={{ rows: 1 }} style={{ marginTop: 16 }} />
          <Divider style={{ margin: '16px 0' }} />
          <Row gutter={[12, 12]}>
            {[...Array(6)].map((_, j) => (
              <Col key={j} span={12}>
                <Skeleton.Input active size="small" style={{ width: '100%' }} />
              </Col>
            ))}
          </Row>
          <Divider style={{ margin: '16px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Skeleton.Button active style={{ width: 100 }} />
            <Skeleton.Button active style={{ width: 120, height: 48 }} />
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ProductSkeleton;
