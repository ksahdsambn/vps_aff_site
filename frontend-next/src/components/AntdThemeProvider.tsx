"use client";

import { ConfigProvider } from "antd";
import { antdTheme } from "@/lib/theme";

/**
 * 仅 AntD ConfigProvider 包装器（客户端组件）。
 *
 * 用于不经过 [locale] 段（因此没有 I18nProvider）的路由，如 /admin/*。
 * 注入 antdTheme，使 theme.ts 的设计 token 在这些路由同样生效。
 * （I18nProvider 内部已含 ConfigProvider，故 [locale] 段无需再用本组件。）
 */
export default function AntdThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConfigProvider theme={antdTheme}>{children}</ConfigProvider>;
}
