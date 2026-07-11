"use client";

import { Typography, Tag, Button, Divider, Row, Col } from "antd";
import {
  ShoppingCartOutlined,
  ArrowLeftOutlined,
  GlobalOutlined,
  ThunderboltOutlined,
  InteractionOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import type { Product } from "@/lib/api";
import type { Locale } from "@/lib/i18n";

/**
 * 产品详情内容（客户端组件）。
 * AntD 组件需 ConfigProvider 上下文，故提取为 client island。
 */
export default function ProductDetailContent({
  product,
  locale,
}: {
  product: Product;
  locale: Locale;
}) {
  const { t } = useTranslation();
  const isZh = locale === "zh";
  const back = isZh ? "返回首页" : "Back to Home";
  const specsTitle = isZh ? "产品规格" : "Specifications";
  const priceLabel = isZh ? "价格/年" : "Price/Year";
  const reviewLabel = isZh ? "查看测评" : "View Review";
  const orderLabel = isZh ? "立即下单" : "Order Now";
  const remarkLabel = isZh ? "备注" : "Remark";
  const cores = isZh ? "核" : "Cores";

  return (
    <section style={{ maxWidth: 1000, margin: "0 auto", padding: "24px" }}>
      {/* 面包屑 */}
      <nav style={{ marginBottom: 24 }}>
        <Link href={`/${locale}`}>
          <Button type="text" icon={<ArrowLeftOutlined />}>
            {back}
          </Button>
        </Link>
      </nav>

      <div className="glass-panel" style={{ padding: 32, borderRadius: 20, marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <Tag color="blue" style={{ borderRadius: 6, fontWeight: 700, marginBottom: 8 }}>
              {product.provider}
            </Tag>
            <Typography.Title level={1} style={{ marginBottom: 0 }}>
              {product.name}
            </Typography.Title>
          </div>
          <div style={{ textAlign: "right" }}>
            <Typography.Title level={2} style={{ color: "#4f46e5", margin: 0 }}>
              {product.price.toFixed(2)} {product.currency}
            </Typography.Title>
            <Typography.Text type="secondary">{priceLabel}</Typography.Text>
          </div>
        </div>

        <Divider />

        <Typography.Title level={2}>{specsTitle}</Typography.Title>
        <Row gutter={[24, 24]}>
          <Col xs={12} md={8}>
            <Typography.Text type="secondary">{t("table.cpu")}</Typography.Text>
            <div style={{ fontSize: 20, fontWeight: 700 }}>
              {product.cpu} {cores}
            </div>
          </Col>
          <Col xs={12} md={8}>
            <Typography.Text type="secondary">{t("table.memory")}</Typography.Text>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{product.memory} {t("table.memoryUnit")}</div>
          </Col>
          <Col xs={12} md={8}>
            <Typography.Text type="secondary">{t("table.disk")}</Typography.Text>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{product.disk} {t("table.diskUnit")}</div>
          </Col>
          <Col xs={12} md={8}>
            <Typography.Text type="secondary">
              <InteractionOutlined /> {t("table.monthlyTraffic")}
            </Typography.Text>
            <div style={{ fontSize: 18, fontWeight: 600 }}>
              {(product.monthlyTraffic / 1000).toFixed(2)} TB
            </div>
          </Col>
          <Col xs={12} md={8}>
            <Typography.Text type="secondary">
              <ThunderboltOutlined /> {t("table.bandwidth")}
            </Typography.Text>
            <div style={{ fontSize: 18, fontWeight: 600 }}>
              {(product.bandwidth / 1000).toFixed(2)} Gbps
            </div>
          </Col>
          <Col xs={12} md={8}>
            <Typography.Text type="secondary">
              <GlobalOutlined /> {t("table.location")}
            </Typography.Text>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{product.location}</div>
          </Col>
        </Row>

        {product.remark && (
          <>
            <Divider />
            <Typography.Text type="secondary">{remarkLabel}:</Typography.Text>
            <Typography.Paragraph style={{ marginTop: 8 }}>{product.remark}</Typography.Paragraph>
          </>
        )}

        <Divider />

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Button
            type="primary"
            size="large"
            href={product.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            icon={<ShoppingCartOutlined />}
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              border: "none",
              height: 52,
              borderRadius: 12,
              fontWeight: 600,
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)",
            }}
          >
            {orderLabel}
          </Button>
          {product.reviewUrl && (
            <Button size="large" href={product.reviewUrl} target="_blank" rel="noopener noreferrer">
              {reviewLabel}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
