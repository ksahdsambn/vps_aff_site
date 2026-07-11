import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProviders, getProductsByProvider, getConfig } from "@/lib/api";
import { resolveLocale, type Locale } from "@/lib/i18n";
import { generateItemListJsonLd, SITE_URL, safeJsonLd } from "@/lib/seo";
import Header from "@/components/Header";
import Announcement from "@/components/Announcement";
import Footer from "@/components/Footer";
import ProviderProductsTable from "@/components/home/ProviderProductsTable";
import type { Product } from "@/lib/api";

/**
 * 服务商聚合页（SSG）。
 *
 * generateStaticParams 预生成所有服务商 × 2 语言。
 * 列出该服务商的所有产品，JSON-LD：ItemList + Brand。
 * 产品表格为 client island（AntD Table 需 ConfigProvider 上下文）。
 */

export async function generateStaticParams() {
  const providers = await getProviders().catch(() => [] as string[]);
  return providers.flatMap((name) => [
    { locale: "zh", name },
    { locale: "en", name },
  ]);
}

interface ProviderPageProps {
  params: Promise<{ locale: string; name: string }>;
}

export default async function ProviderPage({ params }: ProviderPageProps) {
  const { locale: rawLocale, name } = await params;
  const locale: Locale = resolveLocale(rawLocale);

  const [products, config] = await Promise.all([
    getProductsByProvider(name).catch(() => [] as Product[]),
    getConfig().catch(() => null),
  ]);

  if (products.length === 0) {
    notFound();
  }

  const isZh = locale === "zh";
  const back = isZh ? "返回首页" : "Back to Home";
  const providerLabel = isZh ? "服务商" : "Provider";
  const productsCount = isZh
    ? `${products.length} 个产品`
    : `${products.length} products`;

  // JSON-LD：ItemList + Brand（ItemList 统一封装到 lib/seo.ts）
  const itemListJsonLd = generateItemListJsonLd(
    products.map((p) => ({
      name: `${p.provider} ${p.name}`,
      url: `${SITE_URL}/${locale}/products/${p.id}`,
    })),
    `${name} VPS Products`
  );
  const brandJsonLd = {
    "@context": "https://schema.org",
    "@type": "Brand",
    name,
  };

  return (
    <main style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(brandJsonLd) }}
      />

      <Header config={config} locale={locale} asH1={false} />
      <Announcement config={config} />

      <section style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px 48px" }}>
        <nav style={{ marginBottom: 24 }}>
          <Link href={`/${locale}`} className="ant-btn ant-btn-text">
            <span role="img" aria-label="back">←</span> {back}
          </Link>
        </nav>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
            <span style={{ color: "#6366f1" }}>{providerLabel}:</span> {name}
          </h1>
          <p style={{ color: "#64748b", marginTop: 8 }}>{productsCount}</p>
        </div>

        <div className="glass-panel" style={{ padding: 24, borderRadius: 20, overflow: "hidden" }}>
          <ProviderProductsTable products={products} locale={locale} />
        </div>
      </section>

      <Footer config={config} locale={locale} />
    </main>
  );
}

/** 动态 metadata：服务商名作为 title。 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; name: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, name } = await params;
  const locale = resolveLocale(rawLocale);

  const title =
    locale === "zh" ? `${name} VPS 产品价格对比` : `${name} VPS Products & Pricing`;
  const description =
    locale === "zh"
      ? `浏览 ${name} 所有 VPS 产品，对比配置与价格，找到最适合你的方案。`
      : `Browse all ${name} VPS products, compare specs and prices to find the best plan.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/providers/${name}`,
      languages: {
        "zh-CN": `${SITE_URL}/zh/providers/${name}`,
        en: `${SITE_URL}/en/providers/${name}`,
        "x-default": `${SITE_URL}/zh/providers/${name}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}/providers/${name}`,
      type: "website",
    },
  };
}
