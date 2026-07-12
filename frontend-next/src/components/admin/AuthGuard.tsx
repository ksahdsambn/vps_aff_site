"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Spin } from "antd";
import { adminGetSession } from "@/lib/api";

/**
 * Admin 路由守卫（客户端组件）。
 *
 * 从旧前端 AuthGuard 迁移：react-router 的 <Navigate> 改为 Next.js router.replace。
 * 检查会话有效性（HttpOnly Cookie），无效跳转登录页。
 *
 * 加固点（harden 技能）：
 * 1. mountedRef 防止「interval-after-unmount」泄漏——若组件在 checkSession 的
 *    Promise resolve 前卸载，旧实现会在已卸载组件上 setInterval 且永不清除。
 * 2. 检查期间渲染 loading spinner（而非白屏），避免慢网络下看起来像坏了。
 * 3. reason=expired 仅在先前已授权后会话失效时设置，首次访问不误标。
 * 4. 仅 mount 时检查一次 + 定时轮询，pathname 不再入 deps（避免每次路由切换
 *    重新检查 + 白屏闪烁）。
 */
/** 轮询间隔（毫秒）：每 30 秒检查一次会话是否仍然有效。 */
const EXPIRY_CHECK_INTERVAL_MS = 30000;

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  // 记录是否曾经授权过——仅当先前已授权、后会话失效时才标 reason=expired。
  const wasAuthorizedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    const redirectToLogin = (expired: boolean) => {
      const params = expired ? "?reason=expired" : "";
      router.replace(`/admin/login${params}`);
    };

    const checkSession = async () => {
      try {
        await adminGetSession();
        if (!mountedRef.current) return false;
        setAuthorized(true);
        wasAuthorizedRef.current = true;
        return true;
      } catch {
        if (!mountedRef.current) return false;
        setAuthorized(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        // 仅当先前已授权（会话曾有效）时才标 expired，首次访问不误标。
        redirectToLogin(wasAuthorizedRef.current);
        return false;
      }
    };

    void checkSession().then((valid) => {
      // 防泄漏：仅当组件仍挂载时才 setInterval。cleanup 已将 mountedRef 置 false。
      if (valid && mountedRef.current) {
        timerRef.current = setInterval(() => void checkSession(), EXPIRY_CHECK_INTERVAL_MS);
      }
    });

    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [router]);

  // 检查中渲染 loading spinner（而非 null 白屏）。
  if (authorized !== true) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return <>{children}</>;
}
