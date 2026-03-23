# 文件洞察：阶段九（集成测试与验证）

## 洞察目标
在不跳阶段的前提下，把 Docker 部署产物、前台交互、后台管理和安全中间件放到同一条真实运行链路里验证，确保阶段十开始前系统已经具备可交付状态。

## 关键文件与发现
1. `backend/Dockerfile`
   原启动命令只执行 `prisma migrate deploy`，不会注入默认管理员、配置和示例产品，导致 fresh Compose 启动后首页无数据、后台无法登录。

2. `backend/src/scripts/seedRuntime.ts`
   新增运行时种子脚本，把迁移后的初始化补到容器启动链路里，避免阶段九依赖手工 `db seed`。

3. `backend/src/utils/seedData.ts`
   抽出统一种子源，保证 `prisma/seed.ts` 和运行时种子使用同一套数据。
   同时把基础样本扩到 51 条，解决“前台默认每页 50 条但原始种子只有 3 条，无法验证分页”的阶段九阻塞。

4. `backend/prisma/seed.ts`
   原文件内容存在损坏，且重复执行会不断插入产品。
   现已改为复用统一种子逻辑，并在产品存在时跳过重复注入。

5. `backend/src/controllers/adminController.ts`
   后台产品列表原本默认不筛掉 `isDeleted=true`，所以删除后产品仍显示在管理表格里。
   修复后默认列表仅返回未删除产品，只有显式传入 `isDeleted` 才覆盖默认值。

6. `backend/src/app.ts`
   CORS 原默认 `*`，无法通过安全验证。
   同时 Nginx 代理会带来 `X-Forwarded-For`，但 Express 未开启 `trust proxy`，会让限速器发出代理识别警告。
   现已改为显式白名单来源并启用 `trust proxy`。

7. `docker-compose.yml`、`.env.example`、`.env`
   后端新增 `CORS_ORIGIN` 注入，保证容器内运行配置和本地验证环境一致。

## 阶段九验证结论
- T-9.1：通过。全栈容器启动成功，迁移与运行时种子链路闭环。
- T-9.2：通过。首页 11 项展示/筛选/排序/分页/跳转/移动端检查全部通过。
- T-9.3：通过。后台 9 项登录/CRUD/公告/配置/退出流程全部通过。
- T-9.4：通过。6 项鉴权/过期 Token/限速/Helmet/CORS/生产错误响应检查全部通过。

## 结论
- 阶段九的主要问题不是单点功能缺失，而是“真实部署链路下的初始化与安全配置偏差”。
- 当前 Docker Compose 产物已经能在 fresh 环境下自举出可验证的数据和管理员账号。
- 阶段十可以直接进入文档编写，不需要再回滚阶段九代码。

记录人：OpenAI Codex (GPT-5)
记录时间：2026-03-23
