# 阶段二 · 后端核心架构 — 文件洞察

> **执行 AI 模型：** Google Gemini (Antigravity)
> **完成时间：** 2026-03-21 04:35

---

## 新建/修改文件清单

| 文件路径 | 操作 | 用途 |
|---------|------|------|
| `backend/src/app.ts` | 新建 | Express 应用配置，中间件注册 |
| `backend/src/index.ts` | 修改 | 应用入口，端口监听 |
| `backend/src/utils/response.ts` | 新建 | 统一响应格式工具函数 |
| `backend/src/utils/validators.ts` | 新建（占位） | 输入校验（阶段三实现） |
| `backend/src/middleware/errorHandler.ts` | 新建 | 统一错误处理中间件 |
| `backend/src/middleware/rateLimiter.ts` | 新建 | 速率限制中间件 |
| `backend/src/middleware/auth.ts` | 新建 | JWT 认证中间件 |
| `backend/src/types/index.ts` | 新建 | TypeScript 类型定义 |
| `backend/src/routes/adminRoutes.ts` | 新建（占位） | 管理 API 路由（阶段三实现） |
| `backend/src/routes/productRoutes.ts` | 新建（占位） | 产品 API 路由（阶段三实现） |
| `backend/src/routes/configRoutes.ts` | 新建（占位） | 配置 API 路由（阶段三实现） |
| `backend/src/controllers/adminController.ts` | 新建（占位） | 管理控制器（阶段三实现） |
| `backend/src/controllers/productController.ts` | 新建（占位） | 产品控制器（阶段三实现） |
| `backend/src/controllers/configController.ts` | 新建（占位） | 配置控制器（阶段三实现） |

---

## 关键设计决策

### 1. Express 中间件注册顺序
```
helmet → cors → compression → express.json(10mb) → globalLimiter → 路由 → 404处理 → errorHandler
```
- **helmet 在最前**：确保所有响应都带安全头
- **errorHandler 在最后**：捕获所有路由和中间件抛出的异常
- **404 处理在路由之后**：未匹配的路由返回 JSON 格式 404（而非 Express 默认 HTML）

### 2. Express v5 兼容性
- 项目使用 Express 5.2.1，类型签名与 v4 略有不同
- 错误处理中间件使用标准 4 参数签名 `(err, req, res, next)`
- 404 处理使用独立的路由中间件而非 Express 默认行为

### 3. JWT 认证设计
- Token 有效期 30 分钟（将在阶段三登录接口生成时设置）
- JWT_SECRET 从环境变量读取，默认值为 `default_jwt_secret`（仅开发用）
- 区分过期 Token 和无效 Token 的错误消息
- 认证信息挂载到 `req.admin`（包含 adminId 和 username）

### 4. 速率限制配置
- **全局限速**：每 IP 每分钟 100 次 — 防止一般性滥用
- **登录限速**：每 IP 每 15 分钟 5 次 — 防止暴力破解密码
- 触发限速时返回对应业务错误码（429 / 1002）

### 5. TypeScript 类型体系
- `AuthRequest` 扩展 Express Request，包含 admin 属性
- `TrafficInput` / `BandwidthInput` 带单位的输入类型，支持前端传入 GB/TB 和 Mbps/Gbps
- `ERROR_CODES` 常量对象，集中管理所有业务错误码
- `PaginatedResponse<T>` 泛型分页响应类型

---

## 技术注意事项

### Prisma v7 适配器模式
项目使用 Prisma v7+ 的适配器模式（`@prisma/adapter-mariadb`），而非传统的 DATABASE_URL 连接方式。在后续阶段实现 API 时需要注意：
- PrismaClient 初始化需要传入 adapter
- 数据库连接参数分散在多个环境变量中（DATABASE_HOST、DATABASE_USER 等）

### 后续阶段依赖
阶段三需要：
1. 本地运行 MySQL 8.0 数据库
2. 执行 `npx prisma db push` 创建表结构
3. 执行 `npx prisma db seed` 填充初始数据
4. 在各 controller 和 route 中实现具体 API 逻辑

---

## 目录结构（最终状态）

```
backend/src/
├── app.ts                          # Express 应用配置（中间件 + 路由挂载）
├── index.ts                        # 应用入口（dotenv + 端口监听）
├── controllers/
│   ├── adminController.ts          # 管理控制器（占位）
│   ├── configController.ts         # 配置控制器（占位）
│   └── productController.ts        # 产品控制器（占位）
├── middleware/
│   ├── auth.ts                     # JWT 认证中间件
│   ├── errorHandler.ts             # 统一错误处理中间件
│   └── rateLimiter.ts              # 速率限制中间件
├── routes/
│   ├── adminRoutes.ts              # 管理路由（占位）
│   ├── configRoutes.ts             # 配置路由（占位）
│   └── productRoutes.ts            # 产品路由（占位）
├── types/
│   └── index.ts                    # TypeScript 类型定义
├── utils/
│   ├── response.ts                 # 统一响应格式
│   └── validators.ts               # 输入校验（占位）
└── generated/
    └── prisma/                     # Prisma 生成的客户端代码
```
