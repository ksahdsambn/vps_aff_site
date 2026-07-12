# Next.js frontend Dockerfile（standalone 输出）
#
# 替代旧的 Vite + Puppeteer + nginx 方案。
# 基于 Next.js official standalone 构建，移除 Chromium/Puppeteer，镜像体积大幅减小。

FROM node:20-alpine AS builder

WORKDIR /app

# 复制 frontend-next 依赖清单并安装
COPY frontend-next/package.json frontend-next/package-lock.json ./
# package-lock.json 由 npm 11 生成；在 builder 中固定相同 npm 版本，
# 避免 npm 10 对可选 peer 依赖的解析差异导致 npm ci 失败。
RUN npm install --global npm@11.6.2 && npm ci

# 复制源码并构建（standalone 输出）
COPY frontend-next/ ./
# 构建时需要后端地址（BACKEND_URL）。Docker 内后端服务名为 backend。
# SSG 预渲染阶段会尝试拉取数据，后端不可用时降级为空数据（lib/api.ts 已处理）。
ARG BACKEND_URL=http://backend:3000
ENV BACKEND_URL=${BACKEND_URL}
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- 运行阶段 ----
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# 复制 standalone 输出（含最小化 node_modules）
COPY --from=builder /app/.next/standalone ./
# 复制静态资源（standalone 不含 public 和 .next/static，需手动复制）
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
