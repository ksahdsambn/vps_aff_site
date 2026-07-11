import type { MetadataRoute } from "next";
import { getAllProductIds, getProviders, type ProductIdWithUpdated } from "@/lib/api";
import { SITE_URL } from "@/lib/seo";
import { locales } from "@/lib/i18n";

/**
 * 动态 sitemap.xml。
 *
 * 包含：
 * - 首页 × 2 语言（priority 1.0）
 * - 所有产品详情页 × 2 语言（priority 0.8）
 * - 所有服务商页 × 2 语言（priority 0.6）
 * - lastmod 取产品 updatedAt 最大值（复用 getAllProductIds，无需额外请求）
 *
 * 后端不可用时降级为仅首页。
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = SITE_URL;
  const now = new Date().toISOString();

  const [productItems, providers] = await Promise.all([
    getAllProductIds().catch(() => [] as ProductIdWithUpdated[]),
    getProviders().catch(() => [] as string[]),
  ]);

  // lastmod：取最新产品 updatedAt，无数据则用当前时间
  const lastmod =
    productItems.length > 0
      ? productItems.reduce((max, p) => (p.updatedAt > max ? p.updatedAt : max), productItems[0].updatedAt)
      : now;

  const entries: MetadataRoute.Sitemap = [];

  // 首页 × 2 语言
  for (const locale of locales) {
    entries.push({
      url: `${siteUrl}/${locale}`,
      lastModified: lastmod,
      changeFrequency: "daily",
      priority: 1.0,
      alternates: {
        languages: {
          "zh-CN": `${siteUrl}/zh`,
          en: `${siteUrl}/en`,
        },
      },
    });
  }

  // 产品详情页 × 2 语言
  for (const item of productItems) {
    for (const locale of locales) {
      entries.push({
        url: `${siteUrl}/${locale}/products/${item.id}`,
        lastModified: item.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
        alternates: {
          languages: {
            "zh-CN": `${siteUrl}/zh/products/${item.id}`,
            en: `${siteUrl}/en/products/${item.id}`,
          },
        },
      });
    }
  }

  // 服务商页 × 2 语言
  for (const name of providers) {
    for (const locale of locales) {
      entries.push({
        url: `${siteUrl}/${locale}/providers/${name}`,
        lastModified: lastmod,
        changeFrequency: "weekly",
        priority: 0.6,
        alternates: {
          languages: {
            "zh-CN": `${siteUrl}/zh/providers/${name}`,
            en: `${siteUrl}/en/providers/${name}`,
          },
        },
      });
    }
  }

  return entries;
}
