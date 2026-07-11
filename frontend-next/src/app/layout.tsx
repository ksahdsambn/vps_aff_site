import type { Metadata } from "next";
import { Fraunces, Manrope, Noto_Sans_SC } from "next/font/google";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION_ZH, generateOrganizationJsonLd, generateWebSiteJsonLd, safeJsonLd } from "@/lib/seo";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";
const GSC_VERIFICATION = process.env.NEXT_PUBLIC_GSC_VERIFICATION || "";

/**
 * 字体策略：next/font（内置优化、消除 CLS、自动 self-host）。
 *
 * Editorial-Data Minimal 字体配对：
 * - Fraunces（display）：带光学尺寸的软衬线，用于标题与编辑式排版，营造规格出版物的权威感。
 * - Manrope（body/UI）：几何无衬线，替代被设计技能明确禁用的 Inter。
 * - Noto Sans SC（中文）：中文字体（AGENTS.md 要求），与两套拉丁字体各成原生配对。
 *
 * next/font 的 variable 用独立命名（--font-fraunces / --font-manrope / --font-noto），
 * 避免 globals.css 的语义变量（--font-display / --font-body）与之同名冲突。
 * globals.css 在 :root 里用这些原始变量组装出带 fallback 的字体栈。
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
  variable: "--font-fraunces",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  variable: "--font-noto",
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
    <html lang="zh-CN" className={`${fraunces.variable} ${manrope.variable} ${notoSansSC.variable}`} suppressHydrationWarning>
      <body>
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
