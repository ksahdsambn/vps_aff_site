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
import ProductCardList from "@/components/home/ProductCard";

/**
 * 服务商聚合页（SSG + ISR）。
 *
 * generateStaticParams 预生成所有服务商 × 2 语言。
 * 列出该服务商的所有产品，JSON-LD：ItemList + Brand。
 * 产品表格为 client island（AntD Table 需 ConfigProvider 上下文）。
 *
 * revalidate：每小时重新生成。构建时若后端不可用，getProductsByProvider
 * 降级为空数组（走 notFound）；但 ISR 运行时重新生成时，fetch 失败会
 * 冒泡到 error.tsx（而非静默转为 404），保留已生成的旧版本页面。
 */
export const revalidate = 3600;

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
    // 后端不可达时降级为空数组 → notFound()。构建时（SSG）保证构建不失败；
    // 运行时 ISR 重新生成时，Next.js 会保留上次成功生成的页面版本而非发布 404，
    // 下次 revalidate 自动重试。
    getProductsByProvider(name).catch(() => [] as Awaited<ReturnType<typeof getProductsByProvider>>),
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

      <section style={{ maxWidth: 1400, margin: "0 auto", padding: "0 clamp(16px, 4vw, 24px) 48px" }}>
        <nav style={{ marginBottom: 20 }}>
          <Link href={`/${locale}`} style={{ color: "var(--muted)", textDecoration: "none", fontSize: "0.875rem" }}>
            <span role="img" aria-label="back">←</span> {back}
          </Link>
        </nav>

        <div className="page-enter" style={{ marginBottom: 20 }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.6rem, 3.5vw, 2.1rem)",
              fontWeight: 600,
              color: "var(--ink)",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            <span style={{ color: "var(--accent)" }}>{providerLabel}:</span> {name}
          </h1>
          <p style={{ color: "var(--muted)", marginTop: 8, fontSize: "0.875rem" }}>{productsCount}</p>
        </div>

        {/* 桌面表格（≥1200px）。与首页一致：两套视图同时进 SSG HTML，CSS 显隐，
            消除移动端首帧横向滚动。 */}
        <div className="surface page-enter desktopOnly" style={{ padding: 0, overflow: "hidden" }}>
          <ProviderProductsTable products={products} locale={locale} />
        </div>

        {/* 移动卡片（<1200px）。复用首页卡片列表，不传 pagination/sort → 隐藏分页与排序。 */}
        <div className="mobileOnly">
          <ProductCardList data={products} loading={false} />
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
  const encodedName = encodeURIComponent(name);

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
      canonical: `${SITE_URL}/${locale}/providers/${encodedName}`,
      languages: {
        "zh-CN": `${SITE_URL}/zh/providers/${encodedName}`,
        en: `${SITE_URL}/en/providers/${encodedName}`,
        "x-default": `${SITE_URL}/zh/providers/${encodedName}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}/providers/${encodedName}`,
      type: "website",
    },
  };
}
