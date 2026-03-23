# VPS AFF 网站 — 文件洞察记录

## 阶段三 · 后端 API 实现（2026-03-21 by Google Gemini Antigravity）

### 新建文件

| 文件路径 | 行数 | 用途 |
|----------|------|------|
| `backend/src/controllers/adminController.ts` | 371 | 管理员控制器：登录、产品 CRUD、配置管理，共 7 个函数 |
| `backend/src/controllers/productController.ts` | 103 | 产品控制器：公共产品列表和服务商列表，共 2 个函数 |
| `backend/src/controllers/configController.ts` | 51 | 配置控制器：前端系统配置获取，共 1 个函数 |

### 更新文件

| 文件路径 | 变更说明 |
|----------|----------|
| `backend/src/routes/adminRoutes.ts` | 从占位符更新为完整路由定义：7 个路由（login + 产品 CRUD + 配置管理），含 auth 和 loginLimiter 中间件 |
| `backend/src/routes/productRoutes.ts` | 从占位符更新为：`GET /products` 和 `GET /providers` 两个公共路由 |
| `backend/src/routes/configRoutes.ts` | 从占位符更新为：`GET /config` 公共路由 |
| `backend/src/app.ts` | 取消注释并挂载 productRoutes 和 configRoutes 到 `/api` 前缀 |
| `backend/.env` | 添加 DATABASE_HOST/USER/PASSWORD/NAME/PORT、JWT_SECRET、CORS_ORIGIN、NODE_ENV |
| `backend/prisma.config.ts` | 在 migrations 中添加 seed 命令配置（Prisma v7 要求） |

### 关键技术细节

#### Prisma v7 适配器模式
- 项目使用 Prisma v7 的适配器模式（`@prisma/adapter-mariadb`），而非传统的 `DATABASE_URL` 连接方式
- 每个 controller 文件需要独立创建 `PrismaClient` 实例并传入 MariaDB 适配器
- 适配器配置从环境变量读取：`DATABASE_HOST`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`, `DATABASE_PORT`

#### Express v5 类型变化
- Express v5 中 `req.params.id` 的类型为 `string | string[]`（而非 v4 的 `string`）
- 需要使用 `String(req.params.id)` 进行类型安全转换后再 `parseInt`

#### 单位转换设计
- 月流量：前端可传 `{value: number, unit: "GB" | "TB"}`，后端转换为 GB 存储（TB × 1000）
- 带宽：前端可传 `{value: number, unit: "Mbps" | "Gbps"}`，后端转换为 Mbps 存储（Gbps × 1000）
- 也支持直接传数值（向后兼容）

#### API 路由结构
```
公共 API（无认证）
├── GET  /api/products      → 产品列表（筛选/排序/分页）
├── GET  /api/providers      → 服务商去重列表
└── GET  /api/config         → 系统配置

管理 API（需 JWT 认证）
├── POST /api/admin/login    → 登录（+ loginLimiter 速率限制）
├── GET  /api/admin/products → 后台产品列表（默认 20 条/页）
├── POST /api/admin/products → 添加产品
├── PUT  /api/admin/products/:id → 更新产品
├── DELETE /api/admin/products/:id → 软删除产品
├── GET  /api/admin/config   → 获取所有配置
└── PUT  /api/admin/config   → 更新配置
```

#### 错误码映射
| 错误码 | 含义 | 触发场景 |
|--------|------|----------|
| 400 | 参数错误 | 缺少必填字段、货币代码格式错误 |
| 401 | 未认证 | 无 Token、Token 过期、Token 无效 |
| 1001 | 登录失败 | 用户名或密码错误 |
| 1002 | 限速 | 15 分钟内登录失败超过 5 次 |
| 2001 | 产品不存在 | 更新/删除不存在或已软删除的产品 |
| 3001 | 配置不存在 | 更新不存在的 configKey |
| 3002 | 配置更新失败 | 数据库更新异常 |
