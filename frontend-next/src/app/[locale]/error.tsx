"use client";

import Link from "next/link";
import { resolveLocale } from "@/lib/i18n";

/**
 * [locale] 段错误边界。
 *
 * 捕获 [locale] 段内 Server/Client Component 的渲染异常，
 * 渲染带品牌样式 + locale 上下文的错误页（而非 Next.js 默认的裸错误页）。
 *
 * 与 not-found.tsx 一致使用原生 HTML：error boundary 不能依赖
 * ConfigProvider 等上下文（它们可能正是崩溃源）。
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;
  // 从 URL 推断 locale（error boundary 无法直接拿到 params）。
  const pathSegments = typeof window !== "undefined" ? window.location.pathname.split("/") : [];
  const rawLocale = pathSegments[1];
  const locale = resolveLocale(rawLocale);
  const isZh = locale === "zh";

  const title = isZh ? "页面加载失败" : "Couldn't load this page";
  const desc = isZh
    ? "页面加载时遇到问题。可以重试，或返回首页。"
    : "Something went wrong while loading this page. You can try again or head back home.";
  const retry = isZh ? "重试" : "Try again";
  const backHome = isZh ? "返回首页" : "Back to Home";

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
          {title}
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 16, lineHeight: 1.7, margin: "20px 0 28px" }}>
          {desc}
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
              background: "var(--accent)",
              color: "var(--accent-contrast)",
              fontWeight: 600,
              fontSize: "0.9375rem",
              cursor: "pointer",
            }}
          >
            {retry}
          </button>
          <Link
            href={`/${locale}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 44,
              padding: "0 28px",
              borderRadius: 8,
              border: "1px solid var(--rule)",
              background: "transparent",
              color: "var(--ink)",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "0.9375rem",
            }}
          >
            {backHome}
          </Link>
        </div>
      </div>
    </main>
  );
}
