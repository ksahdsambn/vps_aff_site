import type { ThemeConfig } from "antd";

/**
 * AntD 主题配置。
 *
 * 从旧前端 main.tsx 的 ConfigProvider theme 迁移而来，
 * 保持视觉一致性（indigo #6366f1 主色、圆角、glassmorphism 配套）。
 */
export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: "#6366f1",
    fontFamily: "'Inter', 'Noto Sans SC', system-ui, -apple-system, sans-serif",
    borderRadius: 12,
    colorSuccess: "#10b981",
    colorWarning: "#f59e0b",
    colorError: "#ef4444",
    colorInfo: "#3b82f6",
    colorBgContainer: "#ffffff",
    colorBgLayout: "#f8fafc",
    controlHeight: 40,
    boxShadow:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  },
  components: {
    Button: {
      controlHeight: 42,
      paddingInline: 20,
      borderRadius: 10,
      fontWeight: 600,
    },
    Table: {
      headerBg: "transparent",
      headerColor: "#1e293b",
      headerBorderRadius: 12,
      rowHoverBg: "rgba(99, 102, 241, 0.05)",
    },
    Card: {
      borderRadiusLG: 16,
      boxShadowTertiary:
        "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    },
    Input: {
      controlHeight: 42,
      borderRadius: 10,
    },
    Select: {
      controlHeight: 42,
      borderRadius: 10,
    },
  },
};
