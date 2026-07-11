import type { MetadataRoute } from "next";
import { SITE_URL, SITE_NAME } from "@/lib/seo";

/**
 * PWA manifest。
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} - VPS 服务器对比导航`,
    short_name: SITE_NAME,
    description: "全球 VPS 服务器价格对比与推荐",
    start_url: "/zh",
    display: "standalone",
    background_color: "#f5f7ff",
    theme_color: "#6366f1",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
