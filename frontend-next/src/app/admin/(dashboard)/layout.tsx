import AuthGuard from "@/components/admin/AuthGuard";
import AdminShell from "@/components/admin/AdminShell";

/**
 * (dashboard) 路由组布局：受 AuthGuard 保护的 Admin 页面。
 * login 页面不在此路由组内，故无需登录即可访问。
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AdminShell>{children}</AdminShell>
    </AuthGuard>
  );
}
