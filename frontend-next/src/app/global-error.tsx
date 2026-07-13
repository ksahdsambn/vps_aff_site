"use client";

/**
 * 全局错误边界（Root Error Boundary）。
 *
 * Next.js 要求 global-error.tsx 自行渲染 <html><body>，因为它替代根布局
 * （当根布局本身抛错时，没有父布局可回退）。
 *
 * 使用原生 HTML（非 AntD），与 not-found.tsx 风格一致——error boundary 在
 * 最外层不能依赖 ConfigProvider/AntdRegistry 等上下文（它们可能正是崩溃源）。
 *
 * 关键：显式 import globals.css，使 CSS 变量（--paper / --ink / --accent 等）在
 * 此独立 <html> 内有定义。否则 token 未定义、回退到无样式。颜色一律走 token，
 * 保证未来暗色主题（[data-theme="dark"]）对本页同样生效，不硬编码 hex。
 */
import "./globals.css";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;
  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          margin: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: 24,
          background: "var(--paper)",
          fontFamily: "var(--font-body), system-ui, sans-serif",
          color: "var(--text)",
        }}
      >
        <div className="page-enter" style={{ maxWidth: 480 }}>
          <h1
            style={{
              fontFamily: "var(--font-display), Georgia, serif",
              fontSize: "clamp(2.5rem, 8vw, 3.5rem)",
              margin: 0,
              color: "var(--accent)",
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
            }}
          >
            Something went wrong
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 16, lineHeight: 1.7, margin: "20px 0 28px" }}>
            出了点问题
            <br />
            An unexpected error occurred while loading this page. Please try again.
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
              href="/"
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
              Back to Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
