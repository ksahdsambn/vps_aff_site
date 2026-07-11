import Link from "next/link";

/**
 * 全局 404 页面。
 *
 * 友好的 404：含返回首页链接、语义化结构。
 * Next.js 自带 404 处理，无需 nginx error_page hack。
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
        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
        textAlign: "center",
        padding: 24,
        fontFamily: "'Inter', 'Noto Sans SC', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          padding: "48px 64px",
          borderRadius: 24,
          maxWidth: 560,
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(28px)",
          border: "1px solid rgba(255, 255, 255, 0.5)",
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.2)",
        }}
      >
        <h1 style={{ fontSize: "6rem", margin: 0, color: "#6366f1", fontWeight: 800 }}>
          404
        </h1>
        <h2 style={{ marginTop: 0, color: "#0f172a" }}>页面未找到 / Page Not Found</h2>
        <p style={{ color: "#64748b", fontSize: 16, lineHeight: 1.8 }}>
          您访问的页面不存在，可能已被移动或删除。
          <br />
          The page you are looking for does not exist.
        </p>
        <Link
          href="/zh"
          style={{
            display: "inline-block",
            marginTop: 16,
            padding: "14px 32px",
            height: 52,
            borderRadius: 12,
            background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
            color: "#fff",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: 16,
          }}
        >
          返回首页 / Back to Home
        </Link>
      </div>
    </main>
  );
}
