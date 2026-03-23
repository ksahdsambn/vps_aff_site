# 文件洞察：阶段八 (Docker 部署配置)

## 洞察目标
把现有前后端工程收敛为可部署的三容器结构，并确保构建、配置校验、数据库迁移这三条链路都能独立验证通过。

## 操作记录
1. **后端镜像链路 (`backend/Dockerfile`, `backend/.dockerignore`)**:
   为 `backend` 增加 Node 20 Alpine 多阶段构建。
   构建阶段固定执行 `npm ci`、`prisma generate`、`npm run build`，随后 `npm prune --omit=dev` 缩减运行时依赖。
   运行阶段只携带 `dist/`、`prisma/`、运行时 `node_modules` 和 `prisma.config.ts`，并以 `npx prisma migrate deploy && node dist/index.js` 作为启动命令。

2. **Prisma 运行时约束 (`backend/package.json`, `backend/package-lock.json`)**:
   将 `prisma` 从开发依赖移动到生产依赖。
   原因是生产容器启动前必须执行 `prisma migrate deploy`，如果 CLI 仅存在于 devDependencies，运行时镜像会缺少迁移命令。

3. **Nginx 生产配置 (`docker/nginx/default.conf`)**:
   配置了 SPA fallback、`/api` 反向代理、gzip 和静态缓存。
   为了让 `nginx -t` 在独立临时容器中也能通过，同时兼容 Docker 网络内的服务发现，使用了 Docker 内置 DNS `127.0.0.11` 做延迟解析，而不是在加载配置时立即解析 `backend` 主机名。

4. **前端镜像链路 (`docker/frontend/Dockerfile`, `.dockerignore`)**:
   采用根上下文构建，先在 Node 20 Alpine 中执行 `npm ci` 与 `npm run build`，再把 `dist/` 交给 `nginx:alpine` 提供服务。
   根级 `.dockerignore` 用于排除本地 `node_modules`、`dist` 和 `.env`，防止构建上下文膨胀。

5. **Compose 编排与环境模板 (`docker-compose.yml`, `.env.example`)**:
   Compose 中定义了 `db`、`backend`、`frontend` 三服务，补齐 MySQL 健康检查、命名卷和桥接网络。
   后端同时接收 `DATABASE_URL` 和适配器仍在使用的 `DATABASE_HOST/USER/PASSWORD/NAME/PORT`，从而兼容当前代码与 Prisma CLI 的双重需求。
   `.env.example` 只暴露部署者实际需要填写的变量，并保留 `DATABASE_URL` 模板供 Prisma 迁移或本地脚本复用。

6. **迁移生成与验证 (`backend/prisma/migrations/20260322221027_init/migration.sql`)**:
   使用临时 MySQL 容器生成首个迁移。
   由于 `prisma migrate dev` 需要创建 shadow database，生成阶段必须使用具备建库权限的 root 连接；随后再用普通应用用户在另一套干净 MySQL 上执行 `prisma migrate deploy`，验证迁移在生产场景可用。

## 关键结论
- 当前后端代码运行时仍依赖 `DATABASE_HOST/USER/PASSWORD/NAME/PORT`，而 Prisma CLI 依赖 `DATABASE_URL`；Compose 需要同时满足两侧输入。
- 前端镜像在本机 BuildKit 环境下曾多次触发 Docker Desktop Linux engine 掉线，切换到兼容构建模式后可以稳定通过；这是本机构建器问题，不是 Dockerfile 路径问题。
- 阶段八的验收链路已经闭环：后端镜像构建通过、前端镜像构建通过、Nginx 配置语法通过、Compose 配置通过、迁移文件生成通过、干净数据库部署通过。

记录人：OpenAI Codex (GPT-5)
记录时间：2026-03-23
