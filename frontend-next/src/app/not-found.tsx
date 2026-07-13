import Link from "next/link";
import "./globals.css";

/**
 * 全局 404 页面 —— Editorial-Data Minimal。
 *
 * 不透明 paper 背景（无三色渐变、无玻璃卡）。巨型 404 用 Fraunces + accent。
 * 使用原生 HTML（非 AntD），避免 not-found 特殊环境下的组件上下文问题。
 *
 * 关键：根 app/ 无 layout.tsx，但 Next.js 会为 not-found 自动注入最小 <html><head>
 * 外壳。此处 import "./globals.css" 会被提升进那个自动 <head>，使 CSS 变量
 * （--paper / --accent 等）有定义（字体 CSS 变量 --font-fraunces 等不在该外壳，
 * 故 font-family 链附 Georgia/serif fallback）。**不要**在本组件渲染 <html>/<body>，
 * 否则与 Next.js 注入的外壳产生嵌套 <html>（无效标记 + hydration 警告）。
 */
export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
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
            fontSize: "clamp(5rem, 18vw, 8rem)",
            margin: 0,
            color: "var(--accent)",
            fontWeight: 600,
            lineHeight: 1,
            letterSpacing: "-0.04em",
          }}
        >
          404
        </h1>
        <h2
          style={{
            fontFamily: "var(--font-display), Georgia, serif",
            marginTop: 16,
            marginBottom: 12,
            color: "var(--ink)",
            fontSize: "1.5rem",
            fontWeight: 600,
          }}
        >
          Page Not Found / 页面未找到
        </h2>
        <p style={{ color: "var(--muted)", fontSize: 16, lineHeight: 1.8, marginBottom: 28 }}>
          The page you are looking for does not exist.
          <br />
          您访问的页面不存在，可能已被移动或删除。
        </p>
        <Link
          href="/"
          className="boundary-link"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 44,
            padding: "0 28px",
            borderRadius: "var(--r-control)",
            background: "var(--accent)",
            color: "var(--accent-contrast)",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "0.9375rem",
          }}
        >
          Back to Home / 返回首页
        </Link>
      </div>
    </main>
  );
}
