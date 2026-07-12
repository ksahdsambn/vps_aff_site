import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllProductIds, getProductById, getConfig } from "@/lib/api";
import { resolveLocale, type Locale } from "@/lib/i18n";
import {
  generateProductJsonLd,
  generateBreadcrumbJsonLd,
  SITE_URL,
  safeJsonLd,
} from "@/lib/seo";
import Header from "@/components/Header";
import Announcement from "@/components/Announcement";
import Footer from "@/components/Footer";
import ProductDetailContent from "@/components/home/ProductDetailContent";

/** ISR：每小时重新生成 */
export const revalidate = 3600;

/**
 * 产品详情页（ISR）。
 *
 * generateStaticParams 预生成所有产品 × 2 语言。
 * 内容为 client island（AntD 需 ConfigProvider 上下文）。
 * JSON-LD（Product + Offer + BreadcrumbList）由 Server Component 注入。
 */

export async function generateStaticParams() {
  const items = await getAllProductIds().catch(() => []);
  return items.flatMap((item) => [
    { locale: "zh", id: String(item.id) },
    { locale: "en", id: String(item.id) },
  ]);
}

interface ProductDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { locale: rawLocale, id: rawId } = await params;
  const locale: Locale = resolveLocale(rawLocale);
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  const [product, config] = await Promise.all([
    getProductById(id).catch(() => null),
    getConfig().catch(() => null),
  ]);

  if (!product) {
    notFound();
  }

  const isZh = locale === "zh";
  // JSON-LD：Product + Offer + BreadcrumbList（统一封装到 lib/seo.ts）
  const productJsonLd = generateProductJsonLd(product, locale);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: isZh ? "首页" : "Home", url: `${SITE_URL}/${locale}` },
    { name: `${product.provider} ${product.name}`, url: `${SITE_URL}/${locale}/products/${product.id}` },
  ]);

  return (
    <main style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />

      <Header config={config} locale={locale} asH1={false} />
      <Announcement config={config} />

      <ProductDetailContent product={product} locale={locale} />
      <Footer config={config} locale={locale} />
    </main>
  );
}

/** 动态 metadata：产品名作为 title。 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, id: rawId } = await params;
  const locale = resolveLocale(rawLocale);
  const id = Number(rawId);

  if (!Number.isInteger(id) || id <= 0) {
    return { title: "Not Found" };
  }

  const product = await getProductById(id).catch(() => null);
  if (!product) {
    return { title: "Not Found" };
  }

  const title = `${product.provider} ${product.name}`;
  const description =
    locale === "zh"
      ? `${product.provider} ${product.name}：${product.cpu}核 ${product.memory}GB内存 ${product.disk}GB硬盘，年费 ${product.price.toFixed(2)} ${product.currency}`
      : `${product.provider} ${product.name}: ${product.cpu} cores, ${product.memory}GB RAM, ${product.disk}GB disk, ${product.price.toFixed(2)} ${product.currency}/yr`;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/products/${product.id}`,
      languages: {
        "zh-CN": `${SITE_URL}/zh/products/${product.id}`,
        en: `${SITE_URL}/en/products/${product.id}`,
        "x-default": `${SITE_URL}/zh/products/${product.id}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}/products/${product.id}`,
      type: "website",
    },
  };
}
