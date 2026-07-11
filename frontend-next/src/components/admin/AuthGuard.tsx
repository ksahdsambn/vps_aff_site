"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isTokenExpired } from "@/lib/api";

/**
 * Admin 路由守卫（客户端组件）。
 *
 * 从旧前端 AuthGuard 迁移：react-router 的 <Navigate> 改为 Next.js router.replace。
 * 检查 token 存在且未过期，否则跳转登录页。
 * 用 mounted state 避免 SSR/CSR 不一致。
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token || isTokenExpired(token)) {
      if (token) localStorage.removeItem("token");
      router.replace(`/admin/login?from=${encodeURIComponent(pathname)}&reason=expired`);
    } else {
      setAuthorized(true);
    }
  }, [router, pathname]);

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}
