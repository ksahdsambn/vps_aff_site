import { NextResponse } from "next/server";
import {
  getAffiliateUrl,
  AffiliateNotFoundError,
} from "@/lib/api";

/**
 * 推广链接中转路由（Affiliate Link Cloaking）。
 *
 * 用户点击前台展示的 `/go/[id]`（A 域名，站点自身）后，服务端按 id 查到商品的真实
 * `affiliateUrl`（B 域名，商家推广链接），以 **302** 临时跳转过去。
 *
 * 为什么用 Route Handler 而非 page.tsx + redirect()？
 * - Next.js 16 的 `redirect()` 固定使用 307（见 next/dist/client/components/redirect.js，
 *   getRedirectError 默认 statusCode = RedirectStatusCode.TemporaryRedirect = 307），
 *   `RedirectType.replace` 只控制客户端 history 行为，**不**控制 HTTP 状态码。
 * - 307 会保留原始请求方法：若用户以 POST 触发跳转（罕见但可能），目标 URL 会收到
 *   POST 请求；商家推广链接通常期望 GET。302 会把 POST 降级为 GET，更安全。
 * - Route Handler 可显式指定 302，与 affiliate 行业惯例一致（不传递 SEO 权重）。
 *
 * 其他设计要点：
 * - `dynamic = "force-dynamic"`：每次请求实时查库。后台改了 affiliate URL，用户下次
 *   点击立即生效，不受 ISR 缓存影响。
 * - 数据来源是内部端点 /api/go/:id（仅返回 {id, affiliateUrl}）——公共产品接口已
 *   剥离 affiliateUrl 防抓包采集，真实 URL 只通过此专用端点按需获取。
 * - 错误降级（区分 404 vs 5xx）：
 *   - 商品不存在/已软删除（API 业务 404）→ HTTP 404
 *   - 后端/网关故障（5xx、非 JSON 响应）→ 抛错，由 Next.js 渲染 500 页
 */
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // 与后端 parseStrictPositiveId 保持一致的严格校验：仅接受十进制正整数（拒绝
  // 前导零如 "01"、十六进制如 "0x10"、负数、小数、非数字）。避免前端 Number("01")=1
  // 比后端宽松，导致 /go/01 这种畸形路径被当作合法 id 处理（前后端契约一致性）。
  if (!/^[1-9]\d*$/.test(id)) {
    return new NextResponse("Not Found", { status: 404 });
  }
  const numId = Number(id);

  let affiliateUrl: string;
  try {
    const target = await getAffiliateUrl(numId);
    affiliateUrl = target.affiliateUrl;
  } catch (err) {
    // 商品不存在/已软删除（API 业务 404）→ 404
    if (err instanceof AffiliateNotFoundError) {
      return new NextResponse("Not Found", { status: 404 });
    }
    // 后端故障（5xx）、网关错误（getAffiliateUrl 对非 JSON 响应抛 ApiParseError）、
    // 超时等 → 抛错由 Next.js 渲染 500。重新构造 Error 避免泄露 fetch 内部细节。
    throw new Error(
      `Failed to resolve affiliate target for product ${numId}: ` +
      (err instanceof Error ? err.message : String(err)),
    );
  }

  // 302 临时重定向：不传递 SEO 权重，POST 降级为 GET（HTTP 规范允许的 302 行为）。
  const res = NextResponse.redirect(affiliateUrl, 302);
  // 纵深防御：robots.txt 已 Disallow /go/，但 X-Robots-Tag 是响应级别的指令，
  // 即使某些爬虫忽略 robots.txt 或通过外链直接访问，也告诉它不要索引/跟踪此跳转。
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}
