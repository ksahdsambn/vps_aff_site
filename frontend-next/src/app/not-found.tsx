import Link from "next/link";

/**
 * 全局 404 页面 —— Editorial-Data Minimal。
 *
 * 不透明 paper 背景（无三色渐变、无玻璃卡）。巨型 404 用 Fraunces + accent。
 * 使用原生 HTML（非 AntD），避免 not-found 特殊环境下的组件上下文问题。
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
          页面未找到 / Page Not Found
        </h2>
        <p style={{ color: "var(--muted)", fontSize: 16, lineHeight: 1.8, marginBottom: 28 }}>
          您访问的页面不存在，可能已被移动或删除。
          <br />
          The page you are looking for does not exist.
        </p>
        <Link
          href="/zh"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 44,
            padding: "0 28px",
            borderRadius: 8,
            background: "var(--accent)",
            color: "var(--accent-contrast)",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "0.9375rem",
          }}
        >
          返回首页 / Back to Home
        </Link>
      </div>
    </main>
  );
}
