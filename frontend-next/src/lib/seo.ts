/**
 * SEO 共享配置与工具。
 *
 * 统一管理站点 URL（从 NEXT_PUBLIC_SITE_URL 读取，默认 xmde.de），
 * 以及 JSON-LD 生成器（Product/Offer/BreadcrumbList/ItemList/Organization/WebSite）。
 * 消灭所有 your-domain.com 占位符。
 */

import { goLinkAbsolute } from "@/lib/links";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://xmde.de";

export const SITE_NAME = "VPS Navi";

/**
 * 安全序列化 JSON-LD 用于 dangerouslySetInnerHTML。
 *
 * JSON.stringify 不转义 </script> 序列——如果数据中含该序列（如 admin 输入的
 * affiliateUrl 含 </script><script>...），可逃逸 script 标签导致 XSS。
 * 此函数在序列化后替换 < 为 \u003c，纵深防御。
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export const SITE_DESCRIPTION_ZH =
  "VPS Navi 提供主流 VPS 服务商产品价格、配置对比，帮您找到最划算的云服务器。";
export const SITE_DESCRIPTION_EN =
  "VPS Navi compares VPS server prices and specs worldwide to help you find the best deal.";

// ============ JSON-LD 生成器 ============

interface ProductLike {
  id: number;
  provider: string;
  name: string;
  cpu: number;
  memory: number;
  disk: number;
  price: number;
  currency: string;
}

/** Organization schema（品牌知识面板）。 */
export function generateOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.svg`,
    description: SITE_DESCRIPTION_EN,
  };
}

/** WebSite schema（不含 SearchAction，站点无站内搜索）。 */
export function generateWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
  };
}

/** Product + Offer schema。 */
export function generateProductJsonLd(product: ProductLike, locale: "zh" | "en") {
  const cores = locale === "zh" ? "核" : "cores";
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${product.provider} ${product.name}`,
    brand: { "@type": "Brand", name: product.provider },
    description: `${product.provider} ${product.name} - ${product.cpu} ${cores} / ${product.memory}GB / ${product.disk}GB`,
    offers: {
      "@type": "Offer",
      price: product.price.toFixed(2),
      priceCurrency: product.currency,
      // Offer.url 指向站点中转链接而非真实 affiliateUrl，避免在结构化数据中
      // 泄露商家推广域名（与前台按钮 href 保持一致的"链接伪装"语义）。
      url: goLinkAbsolute(product.id),
      availability: "https://schema.org/InStock",
    },
  };
}

/** BreadcrumbList schema。 */
export function generateBreadcrumbJsonLd(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** ItemList schema（首页产品列表 / 服务商聚合页）。 */
export function generateItemListJsonLd(
  items: { name: string; url: string }[],
  listName?: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      url: item.url,
    })),
  };
}
