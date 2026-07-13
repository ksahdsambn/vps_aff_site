"use client";

import React from "react";
import styles from "./Skeleton.module.css";

interface ProductSkeletonProps {
  viewMode: "table" | "card";
  count?: number;
}

/**
 * 加载骨架屏（客户端组件）—— Editorial-Data Minimal。
 *
 * 仅用于客户端后续加载状态。SSG 首帧已有产品数据，不再用骨架屏覆盖首屏。
 *
 * 不依赖 AntD `<Skeleton active>`：后者内部用 `linear-gradient` shimmer + 硬编码
 * 冷灰（#f2f2f2→#e6e6e6），既违反「无渐变」原则，冷灰又与暖调纸面冲突、且暗色
 * 无法重调。这里用 token 化的纯色脉冲（opacity 在 --surface-alt 与 transparent
 * 间过渡），无渐变、暖调一致、暗色就绪。块尺寸匹配真实表格/卡片，避免稳定后的
 * 布局跳动（Skeleton.module.css 同步 ProductCard / ProductTable 的度量）。
 */
const ProductSkeleton: React.FC<ProductSkeletonProps> = ({ viewMode, count = 10 }) => {
  if (viewMode === "table") {
    return (
      <div className="surface" style={{ padding: 24, margin: "0 0 24px" }} aria-busy="true" role="status" aria-label="Loading products">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={styles.tableRow} style={{ marginBottom: 12 }}>
            <div className={`${styles.bar} ${styles.barSm}`} style={{ width: "12%" }} />
            <div className={`${styles.bar} ${styles.barSm}`} style={{ width: "18%" }} />
            <div className={`${styles.bar} ${styles.barSm}`} style={{ width: "10%" }} />
            <div className={`${styles.bar} ${styles.barSm}`} style={{ width: "10%" }} />
            <div className={`${styles.bar} ${styles.barSm}`} style={{ width: "10%" }} />
            <div className={`${styles.bar} ${styles.barSm}`} style={{ width: "12%" }} />
            <div className={`${styles.bar} ${styles.barSm}`} style={{ width: "12%" }} />
            <div className={`${styles.bar} ${styles.barSm}`} style={{ width: "10%" }} />
            <div className={`${styles.bar} ${styles.barSm}`} style={{ width: "14%", flexShrink: 0 }} />
            <div className={styles.bar} style={{ width: "10%", flexShrink: 0 }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.cardList} aria-busy="true" role="status" aria-label="Loading products">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.card}>
          <div className={styles.cardRow}>
            <div className={styles.bar} style={{ width: 90, height: 22 }} />
            <div className={styles.bar} style={{ width: 70, height: 22 }} />
          </div>
          <div className={styles.bar} style={{ width: "70%", height: 16, marginBottom: 4 }} />
          <hr className={styles.rule} />
          <div className={styles.specGrid}>
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j}>
                <div className={styles.bar} style={{ width: "60%", height: 12, marginBottom: 6 }} />
                <div className={styles.bar} style={{ width: "80%", height: 18 }} />
              </div>
            ))}
          </div>
          <hr className={styles.rule} />
          <div className={styles.cardRow}>
            <div className={styles.bar} style={{ width: 90, height: 22 }} />
            <div className={styles.bar} style={{ width: 110, height: 44 }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductSkeleton;
