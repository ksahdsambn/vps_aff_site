"use client";

import React from "react";
import { Skeleton, Divider } from "antd";
import styles from "./ProductCard.module.css";

interface ProductSkeletonProps {
  viewMode: "table" | "card";
  count?: number;
}

/**
 * 加载骨架屏（客户端组件）—— Editorial-Data Minimal。
 * 仅用于客户端后续加载状态。SSG 首帧已有产品数据，不再用骨架屏覆盖首屏。
 * 样式匹配新的不透明卡片 / 表面。
 */
const ProductSkeleton: React.FC<ProductSkeletonProps> = ({ viewMode, count = 10 }) => {
  if (viewMode === "table") {
    return (
      <div
        className="surface"
        style={{ padding: 24, margin: "0 0 24px" }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} active paragraph={{ rows: 1 }} title={false} style={{ marginBottom: 12 }} />
        ))}
      </div>
    );
  }

  return (
    <div className={styles.cardList}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <Skeleton.Button active style={{ width: 90 }} />
            <Skeleton.Button active style={{ width: 70 }} />
          </div>
          <Skeleton active paragraph={{ rows: 1 }} style={{ marginBottom: 4 }} />
          <Divider style={{ margin: "14px 0", borderColor: "var(--rule)" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
            {Array.from({ length: 6 }).map((_, j) => (
              <Skeleton.Input key={j} active size="small" style={{ width: "100%" }} />
            ))}
          </div>
          <Divider style={{ margin: "14px 0", borderColor: "var(--rule)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <Skeleton.Button active style={{ width: 90 }} />
            <Skeleton.Button active style={{ width: 110, height: 44 }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductSkeleton;
