import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, localeToHtmlLang, resolveLocale } from "@/lib/i18n";
import { SITE_URL } from "@/lib/seo";
import I18nProvider from "@/components/I18nProvider";
import SiteDocument, { siteMetadata } from "@/components/SiteDocument";
import "../globals.css";

/**
 * [locale] 段布局。
 *
 * 职责：
 * 1. 校验 locale 参数（仅允许 zh / en），无效则 404。
 * 2. 用 I18nProvider（客户端组件）包裹：初始化 i18next + AntD ConfigProvider + LangSync。
 *
 * 注意：根 layout.tsx 已渲染 <html><body>，此处不输出 <html>。
 */

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale: rawLocale } = await params;
  // 无效 locale 直接 404，不回退到默认（保证 URL 语义清晰）
  if (!locales.includes(rawLocale as (typeof locales)[number])) {
    notFound();
  }
  const locale = resolveLocale(rawLocale);

  return (
    <SiteDocument locale={locale}>
      <I18nProvider locale={locale}>{children}</I18nProvider>
    </SiteDocument>
  );
}

/** 每个 locale 的 hreflang alternates 元数据。 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);

  return {
    ...siteMetadata,
    alternates: {
      languages: {
        "zh-CN": `${SITE_URL}/zh`,
        en: `${SITE_URL}/en`,
        "x-default": `${SITE_URL}/zh`,
      },
    },
    other: {
      "content-language": localeToHtmlLang[locale],
    },
  };
}
