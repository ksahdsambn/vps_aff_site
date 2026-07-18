/**
 * 链接工具：推广链接中转（Affiliate Link Cloaking）。
 *
 * 后台商品存储的 `affiliateUrl`（B 域名，真实商家推广链接）不在前台 HTML 中直接暴露，
 * 而是经站点自身的 `/go/[id]` 跳转路由（A 域名）中转：用户点击 → 路由查库 → 302 跳转。
 *
 * 集中在此生成中转链接，避免散落在多个组件里硬编码 URL 形态。
 *
 * 注意：此处直接读取 NEXT_PUBLIC_SITE_URL（与 seo.ts 同源），而不是从 seo.ts 导入
 * SITE_URL，以避免 seo.ts 反向导入本模块形成循环依赖（seo.ts 的 JSON-LD 需要调用
 * goLinkAbsolute）。
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://xmde.de";

/** 生成相对路径的中转链接（前台按钮 href 用，由浏览器访问当前站点解析）。 */
export function goLink(id: number): string {
  return `/go/${id}`;
}

/** 生成绝对地址的中转链接（JSON-LD / 站外需要完整 URL 的场景用）。 */
export function goLinkAbsolute(id: number): string {
  return `${SITE_URL}/go/${id}`;
}
