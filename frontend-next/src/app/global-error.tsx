"use client";

/**
 * 全局错误边界（Root Error Boundary）。
 *
 * Next.js 要求 global-error.tsx 自行渲染 <html><body>，因为它替代根布局
 * （当根布局本身抛错时，没有父布局可回退）。
 *
 * 使用原生 HTML（非 AntD），与 not-found.tsx 风格一致——error boundary 在
 * 最外层不能依赖 ConfigProvider/AntdRegistry 等上下文（它们可能正是崩溃源）。
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;
  return (
    <html lang="zh-CN">
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
          background: "#faf9f7",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#1a1d29",
        }}
      >
        <div style={{ maxWidth: 480 }}>
          <h1
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "clamp(2.5rem, 8vw, 3.5rem)",
              margin: 0,
              color: "#4338ca",
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
            }}
          >
            出了点问题 / Something went wrong
          </h1>
          <p style={{ color: "#6b6f7d", fontSize: 16, lineHeight: 1.7, margin: "20px 0 28px" }}>
            页面加载时遇到意外错误。请重试，或稍后再访问。
            <br />
            An unexpected error occurred while loading this page. Please try again.
          </p>
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
            重试 / Try again
          </button>
        </div>
      </body>
    </html>
  );
}
