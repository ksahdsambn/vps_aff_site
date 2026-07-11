import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * 动态 robots.txt。
 *
 * - Allow /（公开内容）
 * - Disallow /admin/（后台）、/api/（接口）
 * - 声明 sitemap 位置
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
