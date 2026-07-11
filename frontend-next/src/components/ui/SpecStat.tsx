import React from "react";
import styles from "./SpecStat.module.css";

export interface SpecStatProps {
  /** 标签（CPU / Memory / Disk …），渲染为 eyebrow 样式。 */
  label: string;
  /** 主值，如 "4"、"32"。 */
  value: React.ReactNode;
  /** 单位（Cores / GB / TB / Gbps），可选。 */
  unit?: string;
  /** 可选图标，置于标签前。 */
  icon?: React.ReactNode;
  /** 强调度：默认普通；"strong" 用于价格等关键值。 */
  emphasis?: "default" | "strong";
  className?: string;
}

/**
 * 规格 stat 块 —— Editorial-Data Minimal。
 *
 * 替代 ProductCard / ProductDetailContent 里重复的「label + 大值」块。
 * 标签用 .eyebrow（muted、大写、字距），值用 .num（tabular-nums），
 * 保证技术买家扫读时数值列对齐、层级清晰。
 */
const SpecStat: React.FC<SpecStatProps> = ({
  label,
  value,
  unit,
  icon,
  emphasis = "default",
  className,
}) => {
  return (
    <div
      className={[
        styles.stat,
        emphasis === "strong" ? styles.strong : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={styles.label}>
        {icon && <span className={styles.icon}>{icon}</span>}
        {label}
      </div>
      <div className={styles.value}>
        <span className="num">{value}</span>
        {unit && <span className={styles.unit}>{unit}</span>}
      </div>
    </div>
  );
};

export default SpecStat;
