/**
 * 数值格式化安全工具。
 *
 * 后端 Product 的数值字段（cpu/memory/disk/monthlyTraffic/bandwidth/price）
 * 在类型上声明为 number，但运行时可能因 DB schema 漂移、部分迁移、聚合查询
 * 返回 null/undefined。直接调用 `(val/1000).toFixed(2)` 会在 render 期间抛出
 * TypeError 并通过 error boundary 整页崩溃。
 *
 * 这些函数将「无效输入」降级为占位符 `"—"`，而非抛错，保证页面在数据异常时
 * 仍可渲染（符合 harden 技能「graceful degradation」原则）。
 */

/** 无效数值的统一占位符。 */
const PLACEHOLDER = "—";

/** 判断值是否为可安全格式化的有限数字。 */
function isFormattable(val: unknown): val is number {
  return typeof val === "number" && Number.isFinite(val);
}

/**
 * 安全格式化数值。null/undefined/NaN/Infinity → `"—"`，否则 `val.toFixed(digits)`。
 */
export function formatNum(val: number | null | undefined, digits = 0): string {
  if (!isFormattable(val)) return PLACEHOLDER;
  return val.toFixed(digits);
}

/**
 * 月流量（GB）→ TB 安全换算格式化。
 * 后端以 GB 存储，前端展示为 TB（÷1000，保留 2 位）。
 */
export function formatTraffic(val: number | null | undefined): string {
  if (!isFormattable(val)) return PLACEHOLDER;
  return (val / 1000).toFixed(2);
}

/**
 * 带宽（Mbps）→ Gbps 安全换算格式化。
 * 后端以 Mbps 存储，前端展示为 Gbps（÷1000，保留 2 位）。
 */
export function formatBandwidth(val: number | null | undefined): string {
  if (!isFormattable(val)) return PLACEHOLDER;
  return (val / 1000).toFixed(2);
}

/**
 * 价格安全格式化。null/undefined → `"—"`，否则 `price.toFixed(2) + " " + currency`。
 * currency 为空时不追加空格，避免出现 `"12.00 "` 尾随空格。
 */
export function formatPrice(
  val: number | null | undefined,
  currency?: string | null
): string {
  if (!isFormattable(val)) return PLACEHOLDER;
  const trimmed = (currency ?? "").trim();
  return trimmed ? `${val.toFixed(2)} ${trimmed}` : val.toFixed(2);
}
