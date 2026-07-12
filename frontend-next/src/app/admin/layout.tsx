import type { Metadata } from "next";
import AntdThemeProvider from "@/components/AntdThemeProvider";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "../globals.css";

/**
 * Admin 根布局（仅 metadata + AntD 主题，不含 AuthGuard）。
 *
 * AuthGuard 在 (dashboard) 路由组的 layout 中应用，使 /admin/login 不受保护。
 * 全 admin 区设置 robots noindex，确保不被搜索引擎索引。
 *
 * 注入 AntdThemeProvider（ConfigProvider + antdTheme），使 theme.ts 的设计 token
 * 在 admin 路由同样生效（admin 不经过 [locale] 段，故没有 I18nProvider）。
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: { default: "Admin | VPS Navi", template: "%s | VPS Navi Admin" },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body><AntdRegistry><AntdThemeProvider>{children}</AntdThemeProvider></AntdRegistry></body>
    </html>
  );
}
