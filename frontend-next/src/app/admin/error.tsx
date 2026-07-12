"use client";

import Link from "next/link";

/**
 * Admin 错误边界。
 *
 * 捕获 admin 段内渲染异常。Admin UI 全英文，与 AdminShell 风格一致：
 * 不透明 paper + hairline + 无渐变。
 * 使用原生 HTML（与根 not-found 一致），不依赖 AntD 上下文。
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
        fontFamily: "system-ui, -apple-system, sans-serif",
        background: "#faf9f7",
      }}
    >
      <div style={{ maxWidth: 480 }}>
        <h1
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "clamp(2rem, 6vw, 2.8rem)",
            margin: 0,
            color: "#4338ca",
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          Something went wrong
        </h1>
        <p style={{ color: "#6b6f7d", fontSize: 16, lineHeight: 1.7, margin: "20px 0 28px" }}>
          An unexpected error occurred in the admin panel. Try reloading the page, or sign in again if the problem persists.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => reset()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 44,
              padding: "0 28px",
              borderRadius: 8,
              border: "none",
              background: "#4338ca",
              color: "#fff",
              fontWeight: 600,
              fontSize: "0.9375rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          <Link
            href="/admin/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 44,
              padding: "0 28px",
              borderRadius: 8,
              border: "1px solid #e8e3dc",
              background: "transparent",
              color: "#1a1d29",
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
