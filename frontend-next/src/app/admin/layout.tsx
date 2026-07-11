import type { Metadata } from "next";

/**
 * Admin 根布局（仅 metadata，不含 AuthGuard）。
 *
 * AuthGuard 在 (dashboard) 路由组的 layout 中应用，使 /admin/login 不受保护。
 * 全 admin 区设置 robots noindex，确保不被搜索引擎索引。
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: { default: "Admin | VPS Navi", template: "%s | VPS Navi Admin" },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
