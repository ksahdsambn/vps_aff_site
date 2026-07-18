import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * 动态 robots.txt。
 *
 * - Allow /（公开内容）
 * - Disallow /admin/（后台）、/api/（接口）、/go/（推广链接中转，纯 302 跳转无内容价值）
 * - 声明 sitemap 位置
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/go/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
