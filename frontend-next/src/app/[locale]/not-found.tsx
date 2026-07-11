import Link from "next/link";
import { resolveLocale } from "@/lib/i18n";

/**
 * [locale] 段内 404 页面。
 *
 * 当 notFound() 在 [locale] 段内被调用（无效 locale / 不存在的产品/服务商）时，
 * 渲染此页面而非根级 not-found.tsx，使 404 页面带有正确的 locale 上下文
 * （I18nextProvider + AntD ConfigProvider 已由 [locale]/layout.tsx 注入）。
 *
 * 使用原生 HTML（与根 404 一致），避免在 not-found 特殊环境中引入额外依赖。
 *
 * 注意：Next.js 预渲染 not-found 页面时 params 可能为 undefined，
 * 故用可选参数 + resolveLocale 安全降级到默认语言。
 */
export default async function LocaleNotFound({
  params,
}: {
  params?: Promise<{ locale?: string }>;
}) {
  const resolved = params ? await params : undefined;
  const locale = resolveLocale(resolved?.locale);
  const isZh = locale === "zh";

  const title = isZh ? "页面未找到" : "Page Not Found";
  const desc = isZh
    ? "您访问的页面不存在，可能已被移动或删除。"
    : "The page you are looking for does not exist.";
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
        fontFamily: "'Inter', 'Noto Sans SC', system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "5rem", margin: 0, color: "#6366f1", fontWeight: 800 }}>
        404
      </h1>
      <h2 style={{ marginTop: 0, color: "#0f172a" }}>{title}</h2>
      <p style={{ color: "#64748b", fontSize: 16, lineHeight: 1.8 }}>{desc}</p>
      <Link
        href={`/${locale}`}
        style={{
          display: "inline-block",
          marginTop: 16,
          padding: "14px 32px",
          borderRadius: 12,
          background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
          color: "#fff",
          textDecoration: "none",
          fontWeight: 600,
          fontSize: 16,
        }}
      >
        {backHome}
      </Link>
    </main>
  );
}
