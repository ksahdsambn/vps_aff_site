import type { Metadata } from "next";
import { Fraunces, Manrope, Noto_Sans_SC } from "next/font/google";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { GoogleAnalytics } from "@next/third-parties/google";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION_ZH, generateOrganizationJsonLd, generateWebSiteJsonLd, safeJsonLd } from "@/lib/seo";
import type { Locale } from "@/lib/i18n";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";
const GSC_VERIFICATION = process.env.NEXT_PUBLIC_GSC_VERIFICATION || "";

const fraunces = Fraunces({ subsets: ["latin"], axes: ["opsz", "SOFT"], variable: "--font-fraunces", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const notoSansSC = Noto_Sans_SC({ subsets: ["latin"], variable: "--font-noto", display: "swap" });

export const siteMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} - VPS 服务器对比导航`, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION_ZH,
  keywords: ["VPS", "VPS 对比", "VPS 推荐", "云服务器", "VPS 价格", "VPS navigation", "VPS comparison", "cloud server"],
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website", locale: "zh_CN", alternateLocale: ["en_US"], url: SITE_URL, siteName: SITE_NAME,
    title: `${SITE_NAME} - VPS 服务器对比导航`, description: SITE_DESCRIPTION_ZH,
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: { card: "summary_large_image", title: `${SITE_NAME} - VPS 服务器对比导航`, description: SITE_DESCRIPTION_ZH, images: ["/og-default.png"] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  icons: { icon: "/favicon.svg" },
  ...(GSC_VERIFICATION ? { verification: { google: GSC_VERIFICATION } } : {}),
};

export default function SiteDocument({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <html lang={locale === "en" ? "en" : "zh-CN"} className={`${fraunces.variable} ${manrope.variable} ${notoSansSC.variable}`}>
      <body>
        <AntdRegistry>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(generateOrganizationJsonLd()) }} />
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(generateWebSiteJsonLd()) }} />
          {children}
          {GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
        </AntdRegistry>
      </body>
    </html>
  );
}
