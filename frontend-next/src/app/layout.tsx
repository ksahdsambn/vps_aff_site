import type { Metadata } from "next";
import { Inter, Noto_Sans_SC } from "next/font/google";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION_ZH, generateOrganizationJsonLd, generateWebSiteJsonLd, safeJsonLd } from "@/lib/seo";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";
const GSC_VERIFICATION = process.env.NEXT_PUBLIC_GSC_VERIFICATION || "";

/**
 * 字体策略：迁移到 next/font（内置优化、消除 CLS、自动 self-host）。
 * Inter（拉丁）+ Noto Sans SC（中文），与旧前端字体一致。
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  variable: "--font-noto-sans-sc",
  display: "swap",
});

/**
 * 根布局 metadata（完整 SEO）。
 *
 * - metadataBase：解决所有相对 URL（OG/canonical）的绝对化。
 * - title template：子页面 title 自动追加 "| VPS Navi"。
 * - description / keywords：站点默认值，子页面可覆盖。
 * - openGraph / twitter：社交分享卡，og:image 指向 og-default.png（1200×630）。
 * - robots：全局允许（admin 区在其 layout 中单独 noindex）。
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - VPS 服务器对比导航`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION_ZH,
  keywords: [
    "VPS",
    "VPS 对比",
    "VPS 推荐",
    "云服务器",
    "VPS 价格",
    "VPS navigation",
    "VPS comparison",
    "cloud server",
  ],
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    alternateLocale: ["en_US"],
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - VPS 服务器对比导航`,
    description: SITE_DESCRIPTION_ZH,
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - VPS 服务器对比导航`,
    description: SITE_DESCRIPTION_ZH,
    images: ["/og-default.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.svg",
  },
  // Google Search Console 验证（通过环境变量注入，仅在配置时输出 meta 标签）
  ...(GSC_VERIFICATION
    ? { verification: { google: GSC_VERIFICATION } }
    : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${notoSansSC.variable}`} suppressHydrationWarning>
      <body
        style={{
          fontFamily: "var(--font-inter), var(--font-noto-sans-sc), system-ui, sans-serif",
        }}
      >
        <AntdRegistry>
          {/* Organization + WebSite JSON-LD（全站级，移除 SearchAction） */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: safeJsonLd(generateOrganizationJsonLd()) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: safeJsonLd(generateWebSiteJsonLd()) }}
          />
          {children}
          {/* Google Analytics 4（仅在配置 NEXT_PUBLIC_GA_ID 时加载） */}
          {GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
        </AntdRegistry>
      </body>
    </html>
  );
}
