"use client";

import { Typography, Breadcrumb } from "antd";
import {
  ShoppingCartOutlined,
  GlobalOutlined,
  ThunderboltOutlined,
  InteractionOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import type { Product } from "@/lib/api";
import type { Locale } from "@/lib/i18n";
import SpecStat from "@/components/ui/SpecStat";
import Button from "@/components/ui/Button";
import styles from "./ProductDetailContent.module.css";

/**
 * 产品详情内容（客户端组件）—— Editorial-Data Minimal。
 *
 * 编辑式布局：左对齐 provider chip + Fraunces h1，右侧大号 .num 价格块。
 * 规格走 SpecStat 网格。不透明面板 + hairline 分隔。下单/测评走共享 Button。
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
    <section className={styles.section}>
      <Breadcrumb
        className={styles.crumb}
        items={[
          { title: <Link href={`/${locale}`}>{back}</Link> },
        ]}
      />

      <div className={`${styles.panel} page-enter`}>
        <header className={styles.head}>
          <div className={styles.headLeft}>
            <span className={styles.provider}>{product.provider}</span>
            <Typography.Title level={1} className={styles.title}>
              {product.name}
            </Typography.Title>
          </div>
          <div className={styles.priceBlock}>
            <div className={`${styles.price} num`}>
              {product.price.toFixed(2)}{" "}
              <span className={styles.currency}>{product.currency}</span>
            </div>
            <div className={styles.priceLabel}>{priceLabel}</div>
          </div>
        </header>

        <hr className={styles.rule} />

        <h2 className={styles.sectionTitle}>{specsTitle}</h2>
        <div className={styles.specGrid}>
          <SpecStat label={t("table.cpu")} value={product.cpu} unit={cores} />
          <SpecStat label={t("table.memory")} value={product.memory} unit={t("table.memoryUnit")} />
          <SpecStat label={t("table.disk")} value={product.disk} unit={t("table.diskUnit")} />
          <SpecStat
            label={t("table.monthlyTraffic")}
            value={(product.monthlyTraffic / 1000).toFixed(2)}
            unit="TB"
            icon={<InteractionOutlined />}
          />
          <SpecStat
            label={t("table.bandwidth")}
            value={(product.bandwidth / 1000).toFixed(2)}
            unit="Gbps"
            icon={<ThunderboltOutlined />}
          />
          <SpecStat label={t("table.location")} value={product.location} icon={<GlobalOutlined />} />
        </div>

        {product.remark && (
          <>
            <hr className={styles.rule} />
            <div className={styles.remarkBlock}>
              <div className={styles.remarkLabel}>{remarkLabel}</div>
              <Typography.Paragraph className={styles.remarkText} style={{ marginTop: 6, marginBottom: 0 }}>
                {product.remark}
              </Typography.Paragraph>
            </div>
          </>
        )}

        <hr className={styles.rule} />

        <div className={styles.actions}>
          {product.reviewUrl && (
            <Button variant="ghost" size="large" href={product.reviewUrl} target="_blank" rel="noopener noreferrer">
              {reviewLabel}
            </Button>
          )}
          <Button
            variant="primary"
            size="large"
            href={product.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            icon={<ShoppingCartOutlined />}
            className={styles.orderCta}
          >
            {orderLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}
