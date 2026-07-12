"use client";

import React from "react";
import { Pagination, Select, Empty } from "antd";
import { useTranslation } from "react-i18next";
import {
  ShoppingCartOutlined,
  ExportOutlined,
  GlobalOutlined,
  ThunderboltOutlined,
  InteractionOutlined,
} from "@ant-design/icons";
import type { Product } from "@/lib/api";
import SpecStat from "@/components/ui/SpecStat";
import Button from "@/components/ui/Button";
import styles from "./ProductCard.module.css";

interface ProductCardProps {
  data: Product[];
  loading: boolean;
  /**
   * 分页信息。可选——首页传入以渲染分页器；服务商聚合页不传则隐藏分页。
   */
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
  };
  /**
   * 排序变更回调。可选——首页传入以渲染排序下拉；服务商聚合页不传则隐藏排序。
   */
  onSortChange?: (field: string, order: "ascend" | "descend" | undefined) => void;
  /**
   * 分页变更回调。可选；仅在传入 pagination 时有意义。
   */
  onPageChange?: (page: number, pageSize: number) => void;
}

/**
 * 移动端产品卡片列表（客户端组件）—— Editorial-Data Minimal。
 *
 * 不透明卡片 + hairline 边框（无玻璃态）。悬停仅 border→accent + 微底色，
 * 无 translateY/scale。规格走 SpecStat，下单走共享 Button。
 */
const ProductCardList: React.FC<ProductCardProps> = ({
  data,
  loading,
  pagination,
  onSortChange,
  onPageChange,
}) => {
  const { t } = useTranslation();

  // 排序下拉仅在传入 onSortChange 时渲染（首页有；服务商聚合页无）。
  const showSort = Boolean(onSortChange);
  const handleSortChange = (value: string) => {
    if (!onSortChange) return;
    if (!value) {
      onSortChange("", undefined);
      return;
    }
    const [field, order] = value.split("-");
    onSortChange(field, order as "ascend" | "descend");
  };

  const sortOptions = [
    { label: t("sort.default"), value: "" },
    { label: t("sort.cpuAsc"), value: "cpu-ascend" },
    { label: t("sort.cpuDesc"), value: "cpu-descend" },
    { label: t("sort.memoryAsc"), value: "memory-ascend" },
    { label: t("sort.memoryDesc"), value: "memory-descend" },
    { label: t("sort.diskAsc"), value: "disk-ascend" },
    { label: t("sort.diskDesc"), value: "disk-descend" },
    { label: t("sort.trafficAsc"), value: "monthlyTraffic-ascend" },
    { label: t("sort.trafficDesc"), value: "monthlyTraffic-descend" },
    { label: t("sort.bandwidthAsc"), value: "bandwidth-ascend" },
    { label: t("sort.bandwidthDesc"), value: "bandwidth-descend" },
    { label: t("sort.priceAsc"), value: "price-ascend" },
    { label: t("sort.priceDesc"), value: "price-descend" },
  ];

  return (
    <div className={styles.container}>
      {showSort && (
        <div className={styles.sortHeader}>
          <span className={styles.sortLabel}>
            <InteractionOutlined style={{ marginRight: 8 }} />
            {t("sort.label")}
          </span>
          <Select
            style={{ width: 150 }}
            placeholder={t("sort.default")}
            options={sortOptions}
            onChange={handleSortChange}
            allowClear
            size="large"
          />
        </div>
      )}

      {data.length === 0 && !loading ? (
        <div className={styles.emptyWrap}>
          <Empty description={t("table.noData")} />
        </div>
      ) : (
        <div className={styles.cardList}>
          {data.map((item, index) => (
            <article
              key={item.id}
              className={`${styles.card} stagger-item stagger-delay-${(index % 10) + 1}`}
            >
              <div className={styles.cardHeader}>
                <span className={styles.provider}>{item.provider}</span>
                <div className={styles.price}>
                  <span className="num">
                    {item.price.toFixed(2)} {item.currency}
                  </span>
                  <span className={styles.priceUnit}>/ {t("table.price")}</span>
                </div>
              </div>
              <div className={styles.name}>{item.name}</div>

              <hr className={styles.rule} />

              <div className={styles.details}>
                <SpecStat label={t("table.cpu")} value={item.cpu} unit={t("table.cpuUnit")} />
                <SpecStat label={t("table.memory")} value={item.memory} unit={t("table.memoryUnit")} />
                <SpecStat label={t("table.disk")} value={item.disk} unit={t("table.diskUnit")} />
                <SpecStat
                  label={t("table.monthlyTraffic")}
                  value={(item.monthlyTraffic / 1000).toFixed(2)}
                  unit="TB"
                  icon={<InteractionOutlined />}
                />
                <SpecStat
                  label={t("table.bandwidth")}
                  value={(item.bandwidth / 1000).toFixed(2)}
                  unit="Gbps"
                  icon={<ThunderboltOutlined />}
                />
                <SpecStat label={t("table.location")} value={item.location} icon={<GlobalOutlined />} />
              </div>

              {item.remark && (
                <>
                  <hr className={styles.rule} />
                  <div className={styles.remark}>
                    <span className={styles.remarkLabel}>{t("table.remark")}</span>
                    <span className={styles.remarkText}>{item.remark}</span>
                  </div>
                </>
              )}

              <div className={styles.actions}>
                {item.reviewUrl ? (
                  <Button variant="ghost" size="middle" href={item.reviewUrl} target="_blank" rel="noopener noreferrer">
                    {t("table.reviewLink")} <ExportOutlined />
                  </Button>
                ) : (
                  <span className={styles.noReview}>{t("table.noReview")}</span>
                )}

                <Button
                  variant="primary"
                  size="large"
                  href={item.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  icon={<ShoppingCartOutlined />}
                >
                  {t("table.orderButton")}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {data.length > 0 && pagination && onPageChange && (
        <div className={styles.pagination}>
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={onPageChange}
            showSizeChanger
            showTotal={(total) => t("pagination.total", { total })}
          />
        </div>
      )}
    </div>
  );
};

export default ProductCardList;
