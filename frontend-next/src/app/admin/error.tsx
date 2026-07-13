"use client";

import Link from "next/link";

/**
 * Admin 错误边界。
 *
 * 捕获 admin 段内渲染异常。Admin UI 全英文，与 AdminShell 风格一致：
 * 不透明 paper + hairline + 无渐变。
 * 使用原生 HTML（与根 not-found 一致），不依赖 AntD 上下文。
 *
 * 颜色一律走 CSS 变量（admin/layout.tsx 已 import globals.css，token 在此有定义），
 * 保证未来暗色主题对本页同样生效。原生 button/link 有显式 :focus-visible 焦点环。
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;
  return (
    <main
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: 48,
        fontFamily: "var(--font-body), system-ui, sans-serif",
        background: "var(--paper)",
      }}
    >
      <div className="page-enter" style={{ maxWidth: 480 }}>
        <h1
          style={{
            fontFamily: "var(--font-display), Georgia, serif",
            fontSize: "clamp(2rem, 6vw, 2.8rem)",
            margin: 0,
            color: "var(--accent)",
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          Something went wrong
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 16, lineHeight: 1.7, margin: "20px 0 28px" }}>
          An unexpected error occurred in the admin panel. Try reloading the page, or sign in again if the problem persists.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => reset()}
            className="boundary-cta"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 44,
              padding: "0 28px",
              borderRadius: "var(--r-control)",
              border: "none",
              background: "var(--accent)",
              color: "var(--accent-contrast)",
              fontWeight: 600,
              fontSize: "0.9375rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          <Link
            href="/admin/login"
            className="boundary-link"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 44,
              padding: "0 28px",
              borderRadius: "var(--r-control)",
              border: "1px solid var(--rule)",
              background: "transparent",
              color: "var(--ink)",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "0.9375rem",
            }}
          >
            Back to login
          </Link>
        </div>
      </div>
    </main>
  );
}
