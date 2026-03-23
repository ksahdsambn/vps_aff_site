# VPS AFF 引流下单网站 — AI 开发实施计划

> **项目根目录：** `d:\opencode\vps_aff_site`
> **需求文档：** [requirements.md](file:///d:/opencode/vps_aff_site/requirements.md)
> **技术栈：** React 18 + TypeScript · Ant Design 5.x · Node.js + Express + TypeScript · MySQL 8.0 · Prisma · Vite · Docker Compose
> **目标：** 全程由 AI 开发者自主执行，无人工介入

---

## 阶段〇 · 项目目录结构规划

### 步骤 0.1 — 创建项目根目录结构

**指令：** 在项目根目录下创建以下顶层目录和文件：

```
vps_aff_site/
├── frontend/          # React 前端项目
├── backend/           # Node.js 后端项目
├── docker/            # Docker 相关配置（Nginx 配置、Dockerfile 等）
├── docs/              # 项目文档（部署文档、API文档、使用手册）
├── docker-compose.yml # Docker Compose 编排文件
├── .env.example       # 环境变量示例文件
└── README.md          # 项目说明
```

**验证：** 确认所有目录和文件已创建；使用文件系统工具列出根目录内容，确认结构完整。

---

## 阶段一 · 后端项目初始化

### 步骤 1.1 — 初始化 Node.js + TypeScript 项目

**指令：**
1. 在 `backend/` 目录下运行 `npm init -y` 初始化项目
2. 安装生产依赖：express、cors、helmet、bcryptjs、jsonwebtoken、express-rate-limit、compression、dotenv
3. 安装开发依赖：typescript、ts-node、nodemon、@types/express、@types/cors、@types/bcryptjs、@types/jsonwebtoken、@types/compression
4. 创建 `tsconfig.json`，目标 ES2020，模块 commonjs，启用 strict 模式，outDir 设为 `dist/`
5. 在 `package.json` 中添加 scripts：`dev`（nodemon 启动）、`build`（tsc 编译）、`start`（运行编译后 dist/index.js）

**验证：**
- 运行 `npm run build`，确认编译无错误
- 运行 `npx tsc --version` 确认 TypeScript 已安装
- 检查 `package.json` 的 dependencies 和 devDependencies 包含所有上述包

### 步骤 1.2 — 初始化 Prisma ORM

**指令：**
1. 在 `backend/` 下安装 prisma（开发依赖）和 @prisma/client（生产依赖）
2. 运行 `npx prisma init`，生成 `prisma/schema.prisma` 文件
3. 将 datasource provider 设为 `mysql`
4. 确保 `.env` 中包含 `DATABASE_URL` 变量，格式为 `mysql://user:password@localhost:3306/vps_aff_db`

**验证：**
- 确认 `backend/prisma/schema.prisma` 文件存在
- 确认 `backend/.env` 文件包含 DATABASE_URL
- 运行 `npx prisma validate` 无报错

### 步骤 1.3 — 定义数据库模型

**指令：** 在 `prisma/schema.prisma` 中定义以下三个模型：

**模型 1 — Product（VPS 产品表）：**
- id: 自增整数主键
- provider: 字符串，最大100，必填（服务商）
- name: 字符串，最大200，必填（产品名称）
- cpu: 整数，必填（CPU 核心数）
- memory: 浮点数，必填（内存 GB）
- disk: 浮点数，必填（硬盘 GB）
- monthlyTraffic: 浮点数，必填（月流量，存储为 GB）
- bandwidth: 浮点数，必填（带宽，存储为 Mbps）
- location: 字符串，最大100，必填（位置）
- price: 浮点数，必填，精确两位小数（价格数值）
- currency: 字符串，长度3，必填（货币代码 ISO 4217）
- reviewUrl: 字符串，最大500，选填（测评链接）
- remark: 字符串，最大500，选填（备注）
- affiliateUrl: 字符串，最大500，必填（下单 AFF 链接）
- isDeleted: 布尔值，默认 false（软删除标记）
- createdAt: 自动记录创建时间
- updatedAt: 自动更新修改时间
- 索引：provider、price、createdAt

**模型 2 — SystemConfig（系统配置表）：**
- id: 自增整数主键
- configKey: 字符串，最大100，唯一，必填
- configValue: 长文本，选填
- description: 字符串，最大200，选填
- updatedAt: 自动更新

**模型 3 — Admin（管理员表）：**
- id: 自增整数主键
- username: 字符串，最大50，唯一，必填
- passwordHash: 字符串，必填
- createdAt: 自动记录
- lastLoginAt: 日期时间，选填

**验证：**
- 运行 `npx prisma validate` 确认 schema 无语法错误
- 确认三个模型均已定义且字段类型、约束正确

### 步骤 1.4 — 创建数据库种子文件

**指令：** 创建 `backend/prisma/seed.ts` 文件，用于初始化数据库：

1. 创建默认管理员账号：用户名 `admin`，密码 `admin123`（使用 bcryptjs 加密，salt rounds = 10）
2. 插入默认系统配置项（共 9 项）：
   - `announcement_zh`: 中文公告内容，默认空字符串
   - `announcement_en`: 英文公告内容，默认空字符串
   - `link_telegram`: 空字符串
   - `link_youtube`: 空字符串
   - `link_blog`: 空字符串
   - `link_x`: 空字符串
   - `site_title_zh`: 默认值 "VPS导航"
   - `site_title_en`: 默认值 "VPS Navigator"
   - `site_logo`: 空字符串
3. 插入 3 条示例 VPS 产品数据（用于测试展示）
4. 在 `package.json` 的 `prisma` 字段中配置 seed 命令指向该文件

**验证：**
- TypeScript 编译 seed 文件无报错
- 确认 `package.json` 中 prisma.seed 配置正确

---

## 阶段二 · 后端核心架构搭建

### 步骤 2.1 — 创建后端目录结构

**指令：** 在 `backend/src/` 下创建以下目录结构：

```
src/
├── index.ts           # 应用入口
├── app.ts             # Express 应用配置
├── routes/            # 路由定义
│   ├── productRoutes.ts
│   ├── configRoutes.ts
│   └── adminRoutes.ts
├── controllers/       # 控制器
│   ├── productController.ts
│   ├── configController.ts
│   └── adminController.ts
├── middleware/         # 中间件
│   ├── auth.ts        # JWT 认证中间件
│   ├── errorHandler.ts # 统一错误处理
│   └── rateLimiter.ts # 速率限制
├── utils/             # 工具函数
│   ├── response.ts    # 统一响应格式
│   └── validators.ts  # 输入校验
└── types/             # TypeScript 类型定义
    └── index.ts
```

**验证：** 列出 `backend/src/` 目录，确认所有文件和目录已创建。

### 步骤 2.2 — 实现 Express 应用入口和中间件

**指令：**

1. **app.ts：** 创建 Express 应用实例，按以下顺序注册中间件：
   - helmet（安全头）
   - cors（跨域，限制允许的 origin）
   - compression（gzip 压缩）
   - express.json（JSON 解析，限制 body 大小 10mb）
   - express-rate-limit（全局速率限制：每 IP 每分钟 100 次）
   - 挂载路由（前端 API 路由和后台管理 API 路由）
   - 统一错误处理中间件（放在最后）

2. **index.ts：** 从环境变量读取端口（默认 3000），启动服务并打印日志

3. **middleware/errorHandler.ts：** 实现统一错误处理器，捕获所有异常，返回统一格式 `{ code: number, message: string }`，生产环境不暴露堆栈信息

4. **middleware/rateLimiter.ts：** 创建登录专用限速器（每 IP 每15分钟最多5次登录尝试）

5. **utils/response.ts：** 封装统一成功响应和错误响应的工具函数

**验证：**
- 运行 `npm run build` 编译成功
- 启动应用（`npm run dev`），确认控制台输出端口监听日志
- 向 `http://localhost:3000/` 发送 GET 请求，确认返回 404 格式化错误（不是 Express 默认错误）

### 步骤 2.3 — 实现 JWT 认证中间件

**指令：** 在 `middleware/auth.ts` 中实现：

1. 从请求头 `Authorization: Bearer <token>` 中提取 Token
2. 使用 jsonwebtoken 验证 Token 签名和过期时间
3. JWT_SECRET 从环境变量读取
4. Token 有效期设为 30 分钟（对应需求中的自动登出时间）
5. 验证失败返回 401 错误码和对应消息
6. 验证成功将解析出的管理员信息挂载到 `req.admin`

**验证：**
- 构建无报错
- 编写临时测试路由，不携带 Token 访问受保护路由，确认返回 `{ code: 401, message: "..." }`
- 携带有效 Token 访问，确认通过

---

## 阶段三 · 后端 API 实现

### 步骤 3.1 — 实现管理员登录接口

**指令：** 实现 `POST /api/admin/login`：

1. 接收 username 和 password 字段
2. 校验字段不为空
3. 查询数据库中匹配的管理员
4. 使用 bcryptjs.compare 比较密码哈希
5. 登录成功：生成 JWT Token（载荷含 adminId 和 username），更新 lastLoginAt，返回 token 和过期时间
6. 登录失败：返回业务错误码 1001
7. 使用登录专用限速器保护此接口，触发限速返回错误码 1002

**验证：**
- 启动本地 MySQL 数据库，运行 `npx prisma db push` 和 `npx prisma db seed` 初始化
- 使用 curl/httpie 发送正确的 admin/admin123 登录请求，确认返回 token
- 发送错误密码，确认返回错误码 1001
- 连续发送 6 次错误密码，确认第 6 次返回错误码 1002

### 步骤 3.2 — 实现前端产品列表接口

**指令：** 实现 `GET /api/products`：

1. 接收查询参数：providers（逗号分隔字符串）、sortField、sortOrder（asc/desc）、page（默认1）、pageSize（默认50）、keyword（产品名称搜索）、location（位置搜索）
2. 构建 Prisma 查询条件：
   - 排除 isDeleted = true 的记录
   - providers 非空时，按 provider IN 条件筛选
   - keyword 非空时，对 name 字段进行 contains 模糊匹配
   - location 非空时，对 location 字段进行 contains 模糊匹配
3. 排序：sortField 限定为 cpu/memory/disk/monthlyTraffic/bandwidth/price，sortOrder 限定为 asc/desc；无排序参数时按 createdAt desc
4. 分页：使用 skip 和 take
5. 返回：总记录数(total)、当前页码(page)、每页数量(pageSize)、产品列表(list)

**验证：**
- 请求 `/api/products` 无参数，确认返回 seed 中的示例数据，默认分页参数正确
- 带页码参数请求，确认分页逻辑正确
- 带 sortField=price&sortOrder=asc 请求，确认返回数据按价格升序
- 带 keyword 参数请求，确认模糊搜索生效
- 带 location 参数请求，确认位置搜索生效
- 带 providers 参数请求，确认按服务商筛选生效

### 步骤 3.3 — 实现服务商列表接口

**指令：** 实现 `GET /api/providers`：

1. 查询所有未删除产品的 provider 字段
2. 去重后返回字符串数组

**验证：**
- 请求接口，确认返回去重的服务商列表
- 确认已软删除的产品不计入

### 步骤 3.4 — 实现系统配置接口（前端）

**指令：** 实现 `GET /api/config`：

1. 查询所有系统配置项
2. 返回格式化的配置对象，包含：公告（中英文）、社交媒体链接（4项）、网站标题（中英文）、Logo 地址

**验证：**
- 请求接口，确认返回 seed 中的默认配置
- 确认字段名和结构符合前端预期

### 步骤 3.5 — 实现后台产品管理接口

**指令：** 实现以下四个接口（均需 JWT 认证中间件保护）：

1. **POST /api/admin/products** — 添加产品
   - 校验所有必填字段
   - 流量单位转换：如果前端传入 TB，则乘以 1000 转为 GB 再存储
   - 带宽单位转换：如果前端传入 Gbps，则乘以 1000 转为 Mbps 再存储
   - 货币代码校验：必须为 3 位字母
   - 返回创建的产品记录

2. **PUT /api/admin/products/:id** — 更新产品
   - 检查产品是否存在且未删除，不存在返回错误码 2001
   - 其余逻辑同添加

3. **DELETE /api/admin/products/:id** — 删除产品
   - 检查产品是否存在，不存在返回错误码 2001
   - 执行软删除（isDeleted 设为 true）

4. **GET /api/admin/products** — 后台产品列表
   - 支持 keyword 搜索（匹配 provider 或 name）
   - 分页：默认每页 20 条
   - 包含已软删除的记录（多一个 isDeleted 筛选参数可选）

**验证：**
- 不携带 Token 访问任意管理接口，确认返回 401
- 使用有效 Token 添加一个产品（月流量传 1TB），数据库查询确认存储值为 1000 GB
- 使用有效 Token 添加一个产品（带宽传 0.5Gbps），数据库确认存储值为 500 Mbps
- 更新已存在产品，确认更新成功
- 更新不存在产品 ID，确认返回错误码 2001
- 删除产品，确认数据库 isDeleted 变为 true
- 查询后台产品列表，确认分页和搜索生效

### 步骤 3.6 — 实现后台配置管理接口

**指令：** 实现以下两个接口（均需 JWT 认证）：

1. **GET /api/admin/config** — 获取所有配置项列表
2. **PUT /api/admin/config** — 更新配置
   - 请求体包含 configKey 和 configValue
   - 配置项不存在返回错误码 3001
   - 更新失败返回错误码 3002

**验证：**
- 获取配置确认返回所有 seed 配置项
- 更新 `announcement_zh` 为新内容，再获取确认已更新
- 更新不存在的 configKey，确认返回 3001

---

## 阶段四 · 前端项目初始化

### 步骤 4.1 — 使用 Vite 创建 React + TypeScript 项目

**指令：**
1. 在项目根目录运行 `npx -y create-vite@latest frontend -- --template react-ts`（如目录已存在则先备份/清空）
2. 进入 `frontend/` 运行 `npm install`
3. 安装 antd（Ant Design 5.x）、react-router-dom（v6）、axios、react-i18next、i18next、react-markdown
4. 确认 `vite.config.ts` 存在且配置正确

**验证：**
- 运行 `npm run dev`，确认 Vite 开发服务器启动成功且浏览器可访问
- 运行 `npm run build`，确认生产构建无报错
- 确认 `node_modules/antd` 目录存在

### 步骤 4.2 — 配置前端项目基础架构

**指令：** 在 `frontend/src/` 下创建以下目录结构：

```
src/
├── api/              # API 请求封装
│   └── index.ts      # axios 实例和所有 API 方法
├── components/       # 通用组件
├── pages/            # 页面组件
│   ├── Home/         # 前端产品列表页
│   └── Admin/        # 后台管理页面
├── locales/          # 国际化翻译文件
│   ├── zh.json
│   └── en.json
├── hooks/            # 自定义 hooks
├── utils/            # 工具函数
├── types/            # TypeScript 类型定义
└── App.tsx           # 主应用组件（配置路由）
```

**验证：** 确认所有目录和文件已创建。

### 步骤 4.3 — 配置 Axios 实例和 API 封装

**指令：** 在 `api/index.ts` 中：

1. 创建 axios 实例，baseURL 设为 `/api`（开发时通过 Vite proxy 代理到后端）
2. 添加请求拦截器：自动从 localStorage 读取 token 添加到 Authorization 头
3. 添加响应拦截器：401 错误自动清除 token 并跳转登录页
4. 封装所有 API 方法：
   - `getProducts(params)` — 获取产品列表
   - `getProviders()` — 获取服务商列表
   - `getConfig()` — 获取系统配置
   - `login(username, password)` — 管理员登录
   - `adminGetProducts(params)` — 后台获取产品列表
   - `adminAddProduct(data)` — 添加产品
   - `adminUpdateProduct(id, data)` — 更新产品
   - `adminDeleteProduct(id)` — 删除产品
   - `adminGetConfig()` — 获取后台配置
   - `adminUpdateConfig(key, value)` — 更新配置
5. 在 `vite.config.ts` 中配置 proxy，将 `/api` 代理到 `http://localhost:3000`

**验证：**
- TypeScript 编译无报错
- 启动前端和后端，在浏览器控制台手动调用 API 方法确认代理正常工作

### 步骤 4.4 — 配置国际化（i18n）

**指令：**

1. 创建 `locales/zh.json`，包含所有中文界面文字：
   - 表头：服务商、产品名称、CPU、内存、硬盘、月流量、带宽、位置、价格/年、测评、备注、下单
   - 按钮：筛选、清空、搜索、登录、保存、删除、编辑、添加产品、确认删除
   - 提示：排序仅供参考、暂无数据、加载中、操作成功、操作失败等
   - 后台管理相关文字

2. 创建 `locales/en.json`，对应英文翻译

3. 在 `src/` 中创建 i18n 初始化文件配置 react-i18next：
   - 默认语言 zh
   - 从 localStorage 的 `lang` 键读取用户偏好
   - fallbackLng 设为 zh

**验证：**
- 编译无报错
- 确认 zh.json 和 en.json 的 key 完全一致
- 在组件中使用 `useTranslation` hook 调用，确认渲染正确

---

## 阶段五 · 前端展示页面开发

### 步骤 5.1 — 实现页面顶部区域（Header）

**指令：** 创建 `components/Header.tsx`：

1. 左侧展示网站 Logo 图片和名称（从系统配置 API 获取）
2. 右侧展示 4 个社交媒体图标链接（Telegram、YouTube、博客、X），图标使用 Ant Design Icons 或 SVG
3. 右侧展示语言切换按钮，点击切换中/英文，切换后保存 `lang` 到 localStorage
4. 移动端（<768px）：图标缩小，布局调整为可用状态
5. 样式使用 CSS Modules 或 styled-components

**验证：**
- 桌面端渲染正确，Logo 和 4 个图标可见
- 点击语言切换按钮，界面文字切换
- 刷新页面后语言偏好保持
- 调整浏览器宽度至 <768px，确认移动端布局生效

### 步骤 5.2 — 实现公告栏组件

**指令：** 创建 `components/Announcement.tsx`：

1. 从配置 API 读取公告内容（根据当前语言选择中/英文）
2. 支持 Markdown 格式渲染（使用 react-markdown）
3. 背景色浅黄色，固定位于 Header 下方
4. 公告为空时不渲染
5. 移动端支持折叠/展开，默认展开

**验证：**
- 通过后台设置公告内容（含 Markdown 格式），前端渲染正确
- 切换语言切换至英文，显示英文公告
- 公告为空时，该区域不显示
- 移动端可折叠公告

### 步骤 5.3 — 实现筛选与搜索区域

**指令：** 创建 `components/FilterBar.tsx`：

1. 服务商多选下拉框：选项从 `GET /api/providers` 获取
2. 产品名称搜索框：输入后回车或点击搜索触发查询
3. 位置搜索框：同上
4. 清空筛选按钮：重置所有筛选条件
5. 移动端：筛选区域放入 Ant Design Drawer 抽屉组件，有打开按钮
6. 所有筛选条件变更时触发父组件回调函数，重新请求产品数据

**验证：**
- 服务商下拉框正确加载选项
- 输入产品名称搜索，表格数据正确筛选
- 输入位置搜索，表格数据正确筛选
- 多选服务商，表格仅显示所选服务商的产品
- 点击清空按钮，所有条件重置，表格显示全部数据
- 移动端抽屉式筛选可正常打开和使用

### 步骤 5.4 — 实现产品表格（桌面端）

**指令：** 创建 `pages/Home/ProductTable.tsx`，使用 Ant Design Table 组件：

1. 定义 12 列：服务商、产品名称、CPU、内存、硬盘、月流量、带宽、位置、价格/年、测评、备注、下单
2. **单位转换显示：**
   - 月流量：将 GB 值除以 1000 转为 TB 显示，保留两位小数
   - 带宽：将 Mbps 值除以 1000 转为 Gbps 显示，保留两位小数
   - 价格：显示为 `数值 货币代码` 格式，如 "22.00 USD"
3. **排序：** CPU、内存、硬盘、月流量、带宽、价格列启用排序功能（点击列头触发服务端排序）
4. 价格列表头加 tooltip 提示："按数值排序仅供参考"
5. **测评列：** 有链接时显示为可点击超链接，无链接时显示 "-"
6. **下单列：** 显示为醒目的按钮或链接，点击新窗口打开 AFF 链接
7. 分页：默认 50 条/页，页码变更时请求对应页数据
8. 列头文字使用 i18n 翻译

**验证：**
- 表格正确渲染所有列和数据
- 月流量和带宽的单位转换显示正确（如数据库存1000GB显示为1.00TB）
- 点击排序列头，数据按对应字段排序
- 价格列 tooltip 可见
- 测评链接和下单链接可正常点击跳转
- 分页翻页功能正常
- 切换语言，所有列头文字切换

### 步骤 5.5 — 实现产品卡片（移动端）

**指令：** 创建 `pages/Home/ProductCard.tsx`：

1. 每个产品渲染为一张卡片，展示所有 12 个字段
2. 下单按钮醒目显示（使用 Ant Design Button type="primary"）
3. 排序功能通过顶部排序下拉框选择（字段+方向）
4. 在 `pages/Home/index.tsx` 中根据屏幕宽度（<768px）切换 Table 和 Card 布局
5. 按钮最小点击区域 44x44px

**验证：**
- 浏览器宽度 <768px 时显示卡片布局
- 卡片中所有字段正确显示
- 下单按钮可点击跳转
- 排序功能正常工作
- 所有交互元素点击区域满足 44x44px

### 步骤 5.6 — 组装首页

**指令：** 在 `pages/Home/index.tsx` 中组装所有组件：

1. 顶部 Header
2. 公告栏 Announcement
3. 筛选搜索 FilterBar
4. 产品表格/卡片列表（响应式切换）
5. 管理所有状态：筛选条件、排序、分页、产品数据
6. 页面首次加载时调用 API 获取配置和产品数据

**验证：**
- 页面完整渲染，所有组件可见
- 筛选、排序、搜索、分页、语言切换均可联动工作
- 桌面端和移动端均正常

---

## 阶段六 · 后台管理页面开发

### 步骤 6.1 — 实现登录页面

**指令：** 创建 `pages/Admin/Login.tsx`：

1. 居中表单：用户名和密码输入框 + 登录按钮
2. 使用 Ant Design Form 组件，带前端校验（不为空）
3. 调用 `POST /api/admin/login`，成功后将 token 存入 localStorage 并跳转到后台首页
4. 失败时显示对应错误消息

**验证：**
- 访问 `/admin/login` 可见登录表单
- 空字段提交，显示校验错误
- 正确账号密码登录成功，跳转后台
- 错误密码，显示错误提示

### 步骤 6.2 — 实现后台布局和路由守卫

**指令：**

1. 创建 `pages/Admin/AdminLayout.tsx`：侧边栏导菜单（产品管理、公告管理、配置管理）+ 顶栏（显示管理员名称、退出登录按钮）+ 内容区域
2. 创建路由守卫组件 `components/AuthGuard.tsx`：检查 localStorage 中是否有 token，无则跳转 `/admin/login`
3. 在 `App.tsx` 中配置路由：
   - `/` → 前端首页
   - `/admin/login` → 登录页
   - `/admin/*` → 后台管理（AuthGuard 包裹）
     - `/admin/products` → 产品管理
     - `/admin/announcement` → 公告管理
     - `/admin/settings` → 配置管理

**验证：**
- 未登录直接访问 `/admin/products`，自动跳转到 `/admin/login`
- 登录后可正常访问后台页面
- 点击退出登录，清除 token 并跳转登录页
- 侧边栏菜单切换页面正确

### 步骤 6.3 — 实现产品管理页面

**指令：** 创建 `pages/Admin/Products.tsx`：

1. **产品列表表格：** 使用 Ant Design Table，显示所有字段，支持搜索和分页（每页20条）
2. **添加产品：** 页面顶部有"添加产品"按钮，点击弹出 Modal 表单
   - 表单字段参照需求文档 3.2.2 节
   - 月流量输入框：数字 + 单位选择器（GB/TB）
   - 带宽输入框：数字 + 单位选择器（Mbps/Gbps）
   - 价格：数字 + 货币代码输入框
   - 必填校验和格式校验
3. **编辑产品：** 点击编辑按钮弹出同样 Modal，预填充数据
4. **删除产品：** 点击删除按钮弹出 Ant Design Popconfirm 二次确认

**验证：**
- 列表正确展示产品数据并可分页、搜索
- 添加产品：填写表单提交后列表新增一条，单位转换正确
- 编辑产品：数据正确预填，修改后保存成功
- 删除产品：确认后产品从列表消失（软删除）
- 必填字段未填时显示校验错误

### 步骤 6.4 — 实现公告管理页面

**指令：** 创建 `pages/Admin/Announcement.tsx`：

1. 使用 Ant Design Tabs 分为"中文公告"和"英文公告"两个标签页
2. 每个标签页包含一个 textarea 输入区域（支持 Markdown）和右侧/下方实时预览区域（使用 react-markdown）
3. 保存按钮调用配置更新 API
4. 页面加载时从配置 API 获取现有公告内容

**验证：**
- 页面加载显示现有公告内容
- 输入 Markdown 格式文本，预览区域实时渲染
- 点击保存，刷新前端首页确认公告已更新
- 中英文标签页独立管理

### 步骤 6.5 — 实现配置管理页面

**指令：** 创建 `pages/Admin/Settings.tsx`：

1. **社交媒体链接区域：** 4 个 URL 输入框（Telegram、YouTube、博客、X）
2. **基础配置区域：** 网站标题中英文输入框、Logo 上传（通过 URL 输入或文件上传）、分页数量设置、默认排序字段选择
3. 保存按钮统一保存所有更改
4. 页面加载时预填现有配置

**验证：**
- 页面加载显示所有现有配置
- 修改社交媒体链接，保存后刷新前端首页确认 Header 图标链接更新
- 修改网站标题，保存后前端首页标题更新
- 所有 URL 字段校验格式正确性

---

## 阶段七 · 前端样式与用户体验优化

### 步骤 7.1 — 全局样式和主题配置

**指令：**
1. 配置 Ant Design 主题色（使用 ConfigProvider）
2. 创建全局 CSS 文件，定义：字体（推荐 Inter 或 Noto Sans SC）、基础配色、响应式断点变量
3. 确保所有页面使用一致的配色方案和间距
4. 表格行悬浮高亮效果
5. 按钮和交互元素添加过渡动画

**验证：**
- 视觉审查全站页面，确认风格统一
- 表格行悬浮有视觉反馈
- 按钮交互有过渡效果

### 步骤 7.2 — 移动端适配检查

**指令：**
1. 逐页检查 768px 以下的布局
2. 确认卡片布局替代表格
3. 确认筛选区域使用抽屉组件
4. 确认触摸目标大小 ≥ 44x44px
5. 确认公告可折叠
6. 修复所有移动端布局问题

**验证：**
- 在 375px（iPhone SE）、390px（iPhone 14）、768px（iPad）三个宽度下逐一检查所有页面
- 所有交互功能在移动端正常工作

### 步骤 7.3 — 错误处理与加载状态

**指令：**
1. 所有 API 请求添加 loading 状态（Ant Design Spin 或 Skeleton）
2. API 失败时使用 Ant Design message 组件显示错误提示
3. 表格无数据时显示空状态提示
4. Token 过期自动跳转登录页

**验证：**
- 慢网络下可见 loading 状态
- 后端停止时前端显示友好错误提示
- 空状态表格显示正确

---

## 阶段八 · Docker 部署配置

### 步骤 8.1 — 编写后端 Dockerfile

**指令：** 创建 `backend/Dockerfile`：

1. 使用 node:20-alpine 作为基础镜像
2. 多阶段构建：第一阶段安装依赖和编译 TypeScript，第二阶段仅复制编译产物和 node_modules
3. 运行 `npx prisma generate` 生成 Prisma Client
4. 暴露端口 3000
5. 启动命令：先运行 prisma migrate deploy，再启动 node dist/index.js

**验证：**
- 在本地 `docker build -t vps-backend ./backend` 构建成功
- 确认镜像大小合理（<300MB）

### 步骤 8.2 — 编写前端 Nginx Dockerfile

**指令：** 创建 `docker/frontend/Dockerfile`：

1. 第一阶段：使用 node:20-alpine，复制 frontend/ 源码，执行 `npm run build` 生成生产文件
2. 第二阶段：使用 nginx:alpine，复制构建产物到 `/usr/share/nginx/html/`
3. 复制自定义 Nginx 配置文件

**指令：** 创建 `docker/nginx/default.conf`：

1. 监听 80 端口
2. 根目录指向前端构建产物
3. SPA 路由：所有非文件路径回退到 `index.html`
4. 反向代理：`/api` 路径代理到 `http://backend:3000`
5. 启用 gzip 压缩
6. 静态资源缓存策略

**验证：**
- `docker build -t vps-frontend -f docker/frontend/Dockerfile .` 构建成功
- Nginx 配置语法检查通过（`nginx -t`）

### 步骤 8.3 — 编写 docker-compose.yml

**指令：** 在项目根目录创建 `docker-compose.yml`，定义三个服务：

1. **db（MySQL 8.0）：**
   - 镜像 mysql:8.0
   - 环境变量：MYSQL_ROOT_PASSWORD、MYSQL_DATABASE、MYSQL_USER、MYSQL_PASSWORD
   - 数据卷挂载：`mysql_data:/var/lib/mysql`
   - 健康检查：`mysqladmin ping`

2. **backend（Node.js）：**
   - 构建上下文 `./backend`
   - 环境变量：DATABASE_URL（指向 db 容器）、JWT_SECRET、PORT=3000
   - 依赖 db 服务（depends_on 带 condition: service_healthy）
   - 不对外暴露端口（仅 Nginx 可内网访问）

3. **frontend（Nginx）：**
   - 构建上下文和 Dockerfile 路径
   - 端口映射 80:80
   - 依赖 backend 服务

4. 定义 volumes：mysql_data
5. 定义共用 network

**指令：** 创建 `.env.example` 列出所有需要的环境变量及其说明。

**验证：**
- `docker-compose config` 验证配置文件语法正确
- 确认 `.env.example` 包含所有必需环境变量

### 步骤 8.4 — 编写 Prisma 迁移文件

**指令：**
1. 在本地连接 MySQL 运行 `npx prisma migrate dev --name init` 生成初始迁移文件
2. 确认 `backend/prisma/migrations/` 目录中生成了 SQL 文件
3. 后端 Dockerfile 启动命令中使用 `npx prisma migrate deploy` 进行生产环境迁移

**验证：**
- 迁移文件存在且 SQL 内容正确
- 在一个干净的 MySQL 实例上运行 `npx prisma migrate deploy` 成功创建所有表

---

## 阶段九 · 集成测试与端到端验证

### 步骤 9.1 — Docker Compose 全栈启动测试

**指令：**
1. 创建 `.env` 文件，填入正确的环境变量
2. 运行 `docker-compose up -d --build`
3. 等待所有容器启动完成（需等 MySQL 健康检查通过）
4. 运行 `docker-compose ps` 确认三个容器均为 Up 状态

**验证：**
- 三个容器均运行中
- `docker-compose logs db` 无重大错误
- `docker-compose logs backend` 显示服务启动和数据库迁移成功
- `docker-compose logs frontend` 显示 Nginx 启动成功

### 步骤 9.2 — 端到端功能验证

**指令：** 按以下清单逐一验证：

**前端展示功能：**
1. 浏览器访问 `http://localhost`，确认首页加载，表格显示 seed 数据
2. 切换语言到 English，确认界面文字切换、刷新后保持
3. 输入产品名称搜索，确认结果正确
4. 输入位置搜索，确认结果正确
5. 选择服务商筛选，确认结果正确
6. 点击清空筛选，确认恢复全部数据
7. 点击价格列头排序，确认数据重新排列
8. 翻页操作，确认分页正常
9. 点击测评链接，确认新窗口打开
10. 点击下单链接，确认新窗口打开
11. 缩小浏览器到移动端宽度，确认卡片布局正常

**后台管理功能：**
12. 访问 `/admin/login`，确认登录页面
13. 使用 admin/admin123 登录，确认跳转后台
14. 添加一条新产品（月流量输入 1TB），确认产品出现在列表
15. 编辑刚添加的产品，修改价格，确认保存成功
16. 删除一条产品，确认二次确认后消失
17. 回到前端首页，确认新增产品出现、删除产品消失
18. 修改中文公告内容（含 Markdown），确认前端正确渲染
19. 修改社交媒体链接，确认前端 Header 图标链接更新
20. 点击退出登录，确认返回登录页

**验证：** 以上 20 项全部通过。任何一项失败需返回对应阶段修复。

### 步骤 9.3 — 安全性验证

**指令：** 逐一检查：

1. 不携带 Token 访问所有 `/api/admin/*` 接口，确认均返回 401
2. 使用过期 Token 访问，确认返回 401
3. 密码错误多次登录，确认触发速率限制
4. 检查响应头包含安全头（helmet）
5. 确认 CORS 配置限制了来源
6. 确认生产环境 API 错误响应不泄露堆栈信息

**验证：** 以上 6 项全部通过。

---

## 阶段十 · 文档编写与交付

### 步骤 10.1 — 编写部署文档

**指令：** 创建 `docs/deployment.md`，包含：

1. 服务器环境要求（Debian 12、Docker、Docker Compose）
2. 项目获取方式
3. 环境变量配置说明（逐项说明每个变量）
4. 一键启动命令
5. 服务管理命令（查看状态、日志、重启、停止）
6. 数据备份和恢复方法
7. SSL 证书配置指引
8. 常见问题排查

**验证：** 文档内容完整，跟随文档步骤可在新服务器上成功部署。

### 步骤 10.2 — 编写 API 接口文档

**指令：** 创建 `docs/api.md`，包含所有 7 个前端 + 后台 API 接口的详细说明：
- 路径、方法、参数、请求体、响应格式、错误码、示例

**验证：** 文档覆盖所有 API 接口，示例请求/响应格式正确。

### 步骤 10.3 — 编写管理员使用手册

**指令：** 创建 `docs/admin-guide.md`，包含：
- 登录流程、产品管理操作、公告编辑、配置修改的图文说明

**验证：** 手册覆盖所有后台功能操作。

### 步骤 10.4 — 编写项目 README

**指令：** 更新根目录 `README.md`，包含：
- 项目简介、技术栈、快速开始（本地开发和 Docker 部署）、项目结构说明、文档链接

**验证：** README 内容完整，新开发者可根据 README 了解和启动项目。

---

## 执行顺序总结

| 阶段 | 内容 | 预计步骤数 |
|------|------|-----------|
| 阶段〇 | 项目目录结构规划 | 1 |
| 阶段一 | 后端项目初始化 | 4 |
| 阶段二 | 后端核心架构搭建 | 3 |
| 阶段三 | 后端 API 实现 | 6 |
| 阶段四 | 前端项目初始化 | 4 |
| 阶段五 | 前端展示页面开发 | 6 |
| 阶段六 | 后台管理页面开发 | 5 |
| 阶段七 | 样式与体验优化 | 3 |
| 阶段八 | Docker 部署配置 | 4 |
| 阶段九 | 集成测试与端到端验证 | 3 |
| 阶段十 | 文档编写与交付 | 4 |
| **合计** | | **43 步** |

> [!IMPORTANT]
> 每一步完成后必须执行对应的验证测试，验证通过后方可进入下一步。若验证失败，需在当前步骤内修复后重新验证，直到通过。

> [!WARNING]
> 阶段三依赖本地 MySQL 数据库运行。在开始阶段三之前，确保本地已安装并启动 MySQL 8.0，或使用 Docker 运行一个临时 MySQL 容器用于开发调试。
