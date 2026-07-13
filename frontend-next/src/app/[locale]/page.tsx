import type { Metadata } from "next";
import Header from "@/components/Header";
import Announcement from "@/components/Announcement";
import Footer from "@/components/Footer";
import HomeClient from "@/components/home/HomeClient";
import { getProducts, getProviders, getConfig } from "@/lib/api";
import { resolveLocale, type Locale } from "@/lib/i18n";
import {
  generateItemListJsonLd,
  generateProductJsonLd,
  SITE_URL,
  safeJsonLd,
} from "@/lib/seo";

/**
 * 首页（SSG Server Component）。
 *
 * 核心改造：服务端直接 fetch 后端 API 获取产品列表 + 站点配置，
 * 首帧 HTML 即包含完整产品表格（爬虫无需执行 JS 即可抓取）。
 * 筛选/排序/分页交互由 HomeClient（client island）处理。
 */

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function LocaleHomePage({ params }: HomePageProps) {
  const { locale: rawLocale } = await params;
  const locale: Locale = resolveLocale(rawLocale);

  // 服务端并行预取：产品列表 + 服务商 + 站点配置
  // 任一失败不阻塞整体渲染（降级为空列表）
  const [productsData, providers, config] = await Promise.all([
    getProducts({ page: 1, pageSize: 50 }).catch(() => ({ total: 0, page: 1, pageSize: 50, list: [] as Awaited<ReturnType<typeof getProducts>>["list"] })),
    getProviders().catch(() => [] as string[]),
    getConfig().catch(() => null),
  ]);

  const initialProducts = productsData.list;
  const initialTotal = productsData.total;

  // 首页 JSON-LD：ItemList + 每个产品的 Product/Offer（争取价格富媒体展示）
  const itemListJsonLd = generateItemListJsonLd(
    initialProducts.map((p) => ({
      name: `${p.provider} ${p.name}`,
      url: `${SITE_URL}/${locale}/products/${p.id}`,
    })),
    locale === "zh" ? "VPS 产品价格对比" : "VPS Product Price Comparison"
  );
  const productGraphJsonLd = {
    "@context": "https://schema.org",
    "@graph": initialProducts.map((p) => generateProductJsonLd(p, locale)),
  };

  return (
    <main style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(productGraphJsonLd) }}
      />

      <Header config={config} locale={locale} asH1={false} />
      <Announcement config={config} />

      {/* 视觉隐藏的语义 h1：首页真正的页面主题。Header 渲染为 div（asH1={false}），
          避免品牌名占用 h1，使 SEO/读屏器以「VPS 产品价格对比」为主标题。 */}
      <h1 className="sr-only">
        {locale === "zh" ? "VPS 产品价格对比" : "VPS Product Price Comparison"}
      </h1>

      <HomeClient
        initialProducts={initialProducts}
        initialTotal={initialTotal}
        initialProviders={providers}
        locale={locale}
      />

      <Footer config={config} locale={locale} />
    </main>
  );
}

/** 首页 metadata：按语言动态生成 title/description + OG。 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);

  const title =
    locale === "zh"
      ? "VPS导航 - 全球VPS价格对比与推荐"
      : "VPS Navigator - Global VPS Price Comparison";
  const description =
    locale === "zh"
      ? "实时对比全球VPS服务器价格，帮你找到最具性价比的VPS主机"
      : "Compare VPS server prices worldwide and find the best deals";

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        "zh-CN": `${SITE_URL}/zh`,
        en: `${SITE_URL}/en`,
        "x-default": `${SITE_URL}/zh`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}`,
      locale: locale === "zh" ? "zh_CN" : "en_US",
      type: "website",
      images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "VPS Navi" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-default.png"],
    },
  };
}
