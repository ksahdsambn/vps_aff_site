import Link from "next/link";
import { resolveLocale } from "@/lib/i18n";

/**
 * [locale] 段内 404 页面 —— Editorial-Data Minimal。
 *
 * 当 notFound() 在 [locale] 段内被调用（无效 locale / 不存在产品/服务商）时，
 * 渲染此页面而非根级 not-found.tsx，使 404 页面带有正确的 locale 上下文。
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
        fontFamily: "var(--font-body), system-ui, sans-serif",
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-display), Georgia, serif",
          fontSize: "clamp(4rem, 14vw, 6rem)",
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
          fontSize: "1.4rem",
          fontWeight: 600,
        }}
      >
        {title}
      </h2>
      <p style={{ color: "var(--muted)", fontSize: 16, lineHeight: 1.8, marginBottom: 28 }}>{desc}</p>
      <Link
        href={`/${locale}`}
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
        {backHome}
      </Link>
    </main>
  );
}
