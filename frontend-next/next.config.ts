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
