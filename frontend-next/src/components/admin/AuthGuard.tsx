"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isTokenExpired } from "@/lib/api";

/**
 * Admin 路由守卫（客户端组件）。
 *
 * 从旧前端 AuthGuard 迁移：react-router 的 <Navigate> 改为 Next.js router.replace。
 * 检查 token 存在且未过期，否则跳转登录页。
 * 用 mounted state 避免 SSR/CSR 不一致。
 *
 * 增强：设置定时器在 token 即将过期时主动登出，避免用户停留在过期页面
 * 而不自知（原实现仅在挂载时检查一次，停留超过有效期后需操作才触发 401）。
 */
/** 轮询间隔（毫秒）：每 30 秒检查一次 token 是否即将过期。 */
const EXPIRY_CHECK_INTERVAL_MS = 30000;

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const redirectToLogin = () => {
      const token = localStorage.getItem("token");
      if (token) localStorage.removeItem("token");
      router.replace(`/admin/login?from=${encodeURIComponent(pathname)}&reason=expired`);
    };

    const checkToken = () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token || isTokenExpired(token)) {
        redirectToLogin();
        return false;
      }
      return true;
    };

    // 初始检查
    if (checkToken()) {
      setAuthorized(true);

      // 设置定时器：定期检查 token 是否过期
      timerRef.current = setInterval(() => {
        const token = localStorage.getItem("token");
        if (!token || isTokenExpired(token)) {
          redirectToLogin();
        }
      }, EXPIRY_CHECK_INTERVAL_MS);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [router, pathname]);

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}
