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
import { formatPrice, formatNum } from "@/lib/format";

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
  // 面包屑与可见的 Breadcrumb 组件保持一致：Home → Provider → Product。
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: isZh ? "首页" : "Home", url: `${SITE_URL}/${locale}` },
    { name: product.provider, url: `${SITE_URL}/${locale}/providers/${encodeURIComponent(product.provider)}` },
    { name: `${product.provider} ${product.name}`, url: `${SITE_URL}/${locale}/products/${product.id}` },
  ]);

  return (
    <main style={{ minHeight: "100vh", position: "relative", overflowX: "clip" }}>
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
  const priceText = formatPrice(product.price, product.currency);
  const cpu = formatNum(product.cpu);
  const memory = formatNum(product.memory);
  const disk = formatNum(product.disk);
  const description =
    locale === "zh"
      ? `${product.provider} ${product.name}：${cpu}核 ${memory}GB内存 ${disk}GB硬盘，年费 ${priceText}`
      : `${product.provider} ${product.name}: ${cpu} cores, ${memory}GB RAM, ${disk}GB disk, ${priceText}/yr`;

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
