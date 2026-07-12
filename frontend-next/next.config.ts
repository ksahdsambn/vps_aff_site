import type { NextConfig } from "next";

/**
 * Next.js 配置。
 *
 * - output: 'standalone'：生成独立可运行的 server，适配 Docker 部署。
 * - rewrites：将 /api/* 代理到后端 Express 服务，前端代码统一用相对路径 /api。
 *   开发环境指向 localhost:3000；Docker 内通过环境变量 BACKEND_URL 指向 backend:3000。
 */
const backendUrl =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    const headers = [
      // CSP：'unsafe-inline' 对 script-src/style-src 是当前架构下的硬性约束，无法移除——
      // 首页 / 详情 / 服务商页等采用 SSG 预渲染（output: 'standalone'），构建产物为静态
      // .html，其中嵌入了 Next.js RSC flight 数据的内联 <script>(self.__next_f=...).push(...)
      // 与 AntD CSS-in-JS 的内联 <style id="antd-cssinjs">。这些内联内容在构建期固化、
      // 无 per-request nonce，因此必须放开内联才能渲染。
      // 收敛项（已尽量收紧）：default-src 'self'、object-src 'none'、frame-ancestors 'none'、
      // form-action 'self'、外链仅允许 GTM/GA。
      // 若未来改为纯 SSR（取消静态预渲染），可改用 nonce-based CSP：为每个响应生成随机
      // nonce，注入 <script nonce>/<style nonce> 并用 'nonce-xxx' 替换 'unsafe-inline'。
      { key: "Content-Security-Policy", value: "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' https: data:; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https://www.google-analytics.com; font-src 'self' data:" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=()" },
    ];
    if (process.env.NODE_ENV === "production") {
      headers.push({ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" });
    }
    return [{ source: "/:path*", headers }];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
