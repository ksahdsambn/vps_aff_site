import type { ThemeConfig } from "antd";

/**
 * AntD 主题配置 — Editorial-Data Minimal.
 *
 * 暖色中性调色板 + 单一深靛蓝点缀。不透明表面，无玻璃态，无渐变。
 * 颜色与 globals.css 的 CSS 变量保持同步（暗色主题未来通过 [data-theme="dark"]
 * 覆盖变量即可切换）。
 *
 * 开启 cssVar 模式：AntD 将设计 token 写入 CSS 变量层，使未来暗色主题
 * 只需覆盖一组变量，而非重建整个 ThemeConfig（呼应 AGENTS.md「为暗色主题而设计」）。
 *
 * 注意：Button / Input / Select 的 controlHeight 与 borderRadius 在 AntD 6 中
 * **不是** 组件级 token（ComponentToken 不含这些字段），它们继承全局 token。
 * 故这里只放各组件真正存在的 ComponentToken 字段，高度/圆角统一由全局 token
 * （controlHeight 40 / controlHeightLG 44 / borderRadius 10）治理。
 * Card 同理：无 borderRadiusLG / boxShadowTertiary / paddingLG 字段，
 * 用 bodyPadding / actionsBg 等真实字段。
 */
export const antdTheme: ThemeConfig = {
  cssVar: { key: "vps" },
  // hashed:false —— 本仓库仅含单一 antd 版本。官方文档：单版本应用设 false 可
  // 去掉每条 CSS-in-JS 规则前缀的 :where(.css-xxxxx) 哈希类，缩短选择器、减小
  // 内联 <style> 体积（首页是重灾区：Table+Select+Pagination 收集了 ~228KB）。
  // 配合已开启的 cssVar（token 进 CSS 变量层），规则可被各组件充分共享。
  hashed: false,
  token: {
    colorPrimary: "#4338ca",
    colorText: "#3a3f4f",
    colorTextHeading: "#1a1d29",
    colorTextSecondary: "#71778a",
    colorTextDescription: "#71778a",
    colorBgContainer: "#ffffff",
    colorBgLayout: "#faf9f7",
    colorBgElevated: "#ffffff",
    colorBorder: "#e8e3dc",
    colorBorderSecondary: "#f0ebe3",
    colorSuccess: "#10906a",
    colorWarning: "#b45309",
    colorError: "#c2410c",
    colorInfo: "#2563eb",
    fontFamily:
      "'Manrope', 'Noto Sans SC', system-ui, -apple-system, sans-serif",
    fontSize: 14,
    borderRadius: 10,
    borderRadiusLG: 12,
    borderRadiusSM: 8,
    controlHeight: 40,
    controlHeightLG: 44,
    wireframe: false,
    boxShadow:
      "0 1px 2px 0 rgba(26, 29, 41, 0.04), 0 1px 3px 0 rgba(26, 29, 41, 0.06)",
    boxShadowSecondary:
      "0 1px 2px 0 rgba(26, 29, 41, 0.03), 0 2px 6px -2px rgba(26, 29, 41, 0.06)",
  },
  components: {
    Button: {
      // AntD 6 Button ComponentToken：无 controlHeight / borderRadius，
      // 高度与圆角继承全局 token（controlHeight 40 / borderRadius 10）。
      paddingInline: 20,
      paddingInlineLG: 24,
      fontWeight: 600,
      primaryShadow: "none",
      defaultShadow: "none",
      dangerShadow: "none",
      contentFontSize: 14,
      contentFontSizeLG: 15,
    },
    Table: {
      headerBg: "#ffffff",
      headerColor: "#1a1d29",
      headerSortActiveBg: "#f4f2ee",
      headerSortHoverBg: "#f4f2ee",
      headerBorderRadius: 10,
      rowHoverBg: "#eef0fc",
      borderColor: "#e8e3dc",
      headerSplitColor: "#e8e3dc",
      cellPaddingBlock: 14,
      cellPaddingInline: 14,
    },
    Card: {
      // AntD 6 Card ComponentToken：无 borderRadiusLG / boxShadowTertiary / paddingLG。
      // 圆角继承全局 borderRadiusLG（12）；阴影用 actionsBg/headerBg 等真实字段。
      headerBg: "#ffffff",
      bodyPadding: 24,
      headerPadding: 16,
      actionsBg: "#faf9f7",
    },
    Input: {
      // AntD 6 Input ComponentToken：无 controlHeight / borderRadius，继承全局。
      activeShadow: "0 0 0 3px rgba(67, 56, 202, 0.16)",
      paddingInline: 12,
      paddingInlineLG: 14,
    },
    Select: {
      // AntD 6 Select ComponentToken：无 controlHeight / borderRadius，继承全局。
      // 这里留空占位，说明已确认其继承全局 token。
    },
    Menu: {
      itemSelectedBg: "#eef0fc",
      itemSelectedColor: "#4338ca",
      itemHoverBg: "#f4f2ee",
      itemColor: "#3a3f4f",
    },
    Pagination: {
      itemActiveBg: "#4338ca",
      itemBg: "transparent",
      itemLinkBg: "transparent",
    },
    Tag: {
      // AntD 6 Tag ComponentToken：无 borderRadiusSM，圆角继承全局 borderRadiusSM（8）。
      defaultBg: "#f4f2ee",
      defaultColor: "#3a3f4f",
    },
    Layout: {
      headerBg: "#ffffff",
      headerHeight: 64,
      bodyBg: "#faf9f7",
      siderBg: "#1a1d29",
    },
  },
};
