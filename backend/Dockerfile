FROM node:20-alpine AS builder

WORKDIR /app

ARG DATABASE_URL="mysql://placeholder:placeholder@localhost:3306/vps_aff_site"
ENV DATABASE_URL=${DATABASE_URL}

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json ./
RUN npx prisma generate

COPY src ./src
# 只编译，不在此处 prune。
# builder 必须保留完整 node_modules（含作为 devDependency 的 prisma CLI），
# 因为 docker-compose 的 `migrate` 服务用 `target: builder` 来执行
# `npx prisma migrate deploy`，而 prisma.config.ts 依赖 `prisma/config`。
# 生产依赖的剪枝改在下方 runner 阶段进行，避免 migrate 拿到被剪除的镜像。
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# 先拷入完整产物（含完整 node_modules + dist），再原地剪除开发依赖。
# 这样 builder 仍含 prisma CLI（供 migrate 使用），而运行镜像只保留生产依赖。
COPY --from=builder /app ./
RUN npm prune --omit=dev --omit=optional

EXPOSE 3000

CMD ["node", "dist/index.js"]
