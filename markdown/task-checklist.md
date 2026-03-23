# VPS AFF 网站 — AI 执行清单

> **规则：每项任务必须按顺序执行，验证通过后方可勾选 ✅ 并进入下一项。验证未通过时执行「回退」操作后重试，严禁跳步。**

---

## 阶段〇 · 项目目录结构

### T-0.1 创建顶层目录
- **操作：** 在 `d:\opencode\vps_aff_site\` 下创建 `frontend/`、`backend/`、`docker/`、`docs/` 四个空目录
- **完成标准：** 四个目录均存在
- **测试：** 运行 `ls` / `dir` 列出根目录，确认四个目录均出现
- **回退：** 删除错误目录重新创建
- [x] **通过 → 进入 T-0.2**

### T-0.2 创建顶层文件
- **操作：** 在根目录创建 `docker-compose.yml`（空文件）、`.env.example`（空文件）、`README.md`（写入项目名称一行）
- **完成标准：** 三个文件均存在且可读
- **测试：** 逐一读取三个文件确认无报错
- **回退：** 删除后重建
- [x] **通过 → 进入 T-1.1**

---

## 阶段一 · 后端项目初始化

### T-1.1 初始化 npm 项目
- **操作：** 在 `backend/` 下执行 `npm init -y`
- **完成标准：** `backend/package.json` 存在且包含 name 字段
- **测试：** 读取 `package.json`，确认 JSON 格式合法
- **回退：** 删除 `package.json` 重新执行
- [x] **通过 → 进入 T-1.2**

### T-1.2 安装后端生产依赖
- **操作：** 在 `backend/` 执行 `npm install express cors helmet bcryptjs jsonwebtoken express-rate-limit compression dotenv`
- **完成标准：** `package.json` 的 dependencies 包含以上 8 个包
- **测试：** 读取 `package.json` 的 dependencies 字段，逐一核对 8 个包名
- **回退：** 缺失的包单独 `npm install`
- [x] **通过 → 进入 T-1.3**

### T-1.3 安装后端开发依赖
- **操作：** 在 `backend/` 执行 `npm install -D typescript ts-node nodemon @types/express @types/cors @types/bcryptjs @types/jsonwebtoken @types/compression`
- **完成标准：** `package.json` 的 devDependencies 包含以上 8 个包
- **测试：** 读取 devDependencies 字段逐一核对；运行 `npx tsc --version` 返回版本号
- **回退：** 缺失的包单独 `npm install -D`
- [x] **通过 → 进入 T-1.4**

### T-1.4 配置 TypeScript
- **操作：** 在 `backend/` 创建 `tsconfig.json`：target=ES2020，module=commonjs，strict=true，outDir=dist/，esModuleInterop=true，skipLibCheck=true，rootDir=src/
- **完成标准：** `tsconfig.json` 存在且 JSON 格式合法，包含上述全部配置项
- **测试：** 在 `backend/src/` 创建一个只含 `console.log("ok")` 的 `index.ts`，运行 `npx tsc --noEmit` 无报错
- **回退：** 修正 `tsconfig.json` 中的错误项
- [x] **通过 → 进入 T-1.5**

### T-1.5 配置 npm scripts
- **操作：** 在 `package.json` 的 scripts 中添加：`"dev": "nodemon --exec ts-node src/index.ts"`、`"build": "tsc"`、`"start": "node dist/index.js"`
- **完成标准：** 三个 script 均存在
- **测试：** 运行 `npm run build`，确认 `backend/dist/index.js` 生成且无编译错误
- **回退：** 修正 scripts 字段
- [x] **通过 → 进入 T-1.6**

### T-1.6 安装 Prisma
- **操作：** 在 `backend/` 执行 `npm install @prisma/client` 和 `npm install -D prisma`
- **完成标准：** dependencies 含 `@prisma/client`，devDependencies 含 `prisma`
- **测试：** 运行 `npx prisma --version` 返回版本信息
- **回退：** 重新安装缺失包
- [x] **通过 → 进入 T-1.7**

### T-1.7 初始化 Prisma
- **操作：** 在 `backend/` 执行 `npx prisma init`，将生成的 `prisma/schema.prisma` 中 datasource provider 改为 `mysql`
- **完成标准：** `backend/prisma/schema.prisma` 存在，provider 为 mysql；`backend/.env` 存在且含 DATABASE_URL
- **测试：** 运行 `npx prisma validate` 无报错
- **回退：** 修正 schema 文件或 .env 文件
- [x] **通过 → 进入 T-1.8**

### T-1.8 定义 Product 模型
- **操作：** 在 `schema.prisma` 中定义 Product 模型，包含 16 个字段（id/provider/name/cpu/memory/disk/monthlyTraffic/bandwidth/location/price/currency/reviewUrl/remark/affiliateUrl/isDeleted/createdAt/updatedAt）及 3 个索引（provider/price/createdAt）
- **完成标准：** Product 模型含 16 个字段，字段类型和约束与需求一致
- **测试：** 运行 `npx prisma validate` 无报错；检查 schema 中 Product 模型字段数量 = 16
- **回退：** 修正字段定义后重新 validate
- [x] **通过 → 进入 T-1.9**

### T-1.9 定义 SystemConfig 模型
- **操作：** 在 `schema.prisma` 中定义 SystemConfig 模型：id、configKey（唯一）、configValue（长文本）、description、updatedAt
- **完成标准：** 模型含 5 个字段，configKey 有 @unique 约束
- **测试：** 运行 `npx prisma validate` 无报错
- **回退：** 修正字段后重新 validate
- [x] **通过 → 进入 T-1.10**

### T-1.10 定义 Admin 模型
- **操作：** 在 `schema.prisma` 中定义 Admin 模型：id、username（唯一）、passwordHash、createdAt、lastLoginAt（可选）
- **完成标准：** 模型含 5 个字段，username 有 @unique 约束
- **测试：** 运行 `npx prisma validate` 无报错；确认 schema 中共 3 个 model
- **回退：** 修正字段后重新 validate
- [x] **通过 → 进入 T-1.11**

### T-1.11 创建种子文件
- **操作：** 创建 `backend/prisma/seed.ts`，实现：(1) 用 bcryptjs 创建 admin/admin123 账号 (2) 插入 9 条默认配置项 (3) 插入 3 条示例产品
- **完成标准：** seed.ts 存在，包含 admin 创建、9 条 config upsert、3 条 product 创建
- **测试：** 运行 `npx tsc --noEmit prisma/seed.ts`（或 `ts-node --check`）确认编译无错误
- **回退：** 修正 TypeScript 错误后重新编译
- [x] **通过 → 进入 T-1.12**

### T-1.12 配置 Prisma seed 命令
- **操作：** 在 `package.json` 添加 `"prisma": { "seed": "ts-node prisma/seed.ts" }`
- **完成标准：** `package.json` 中 prisma.seed 字段值正确
- **测试：** 读取 `package.json` 确认字段存在且路径正确
- **回退：** 修正 package.json
- [x] **通过 → 进入 T-2.1**

---

## 阶段二 · 后端核心架构

### T-2.1 创建后端 src 目录结构
- **操作：** 在 `backend/src/` 下创建目录 `routes/`、`controllers/`、`middleware/`、`utils/`、`types/`；创建文件 `app.ts`、`index.ts`、`routes/productRoutes.ts`、`routes/configRoutes.ts`、`routes/adminRoutes.ts`、`controllers/productController.ts`、`controllers/configController.ts`、`controllers/adminController.ts`、`middleware/auth.ts`、`middleware/errorHandler.ts`、`middleware/rateLimiter.ts`、`utils/response.ts`、`utils/validators.ts`、`types/index.ts`
- **完成标准：** 5 个目录 + 14 个文件全部存在
- **测试：** 递归列出 `backend/src/`，逐一核对文件名
- **回退：** 创建缺失的文件/目录
- [x] **通过 → 进入 T-2.2**

### T-2.2 实现统一响应工具
- **操作：** 在 `utils/response.ts` 中封装 `successResponse(data)` 和 `errorResponse(code, message)` 两个函数
- **完成标准：** 导出两个函数，successResponse 返回 `{ code: 0, data }`，errorResponse 返回 `{ code, message }`
- **测试：** `npm run build` 编译无错误
- **回退：** 修正类型或语法错误
- [x] **通过 → 进入 T-2.3**

### T-2.3 实现统一错误处理中间件
- **操作：** 在 `middleware/errorHandler.ts` 中实现 Express 错误处理中间件（4 参数函数），捕获所有异常，使用 errorResponse 格式返回，生产环境隐藏堆栈
- **完成标准：** 导出一个符合 Express ErrorRequestHandler 签名的函数
- **测试：** `npm run build` 编译无错误
- **回退：** 修正实现
- [x] **通过 → 进入 T-2.4**

### T-2.4 实现速率限制中间件
- **操作：** 在 `middleware/rateLimiter.ts` 中创建两个限速器：(1) 全局限速 — 每IP每分钟100次 (2) 登录限速 — 每IP每15分钟5次
- **完成标准：** 导出 `globalLimiter` 和 `loginLimiter` 两个中间件
- **测试：** `npm run build` 编译无错误
- **回退：** 修正配置参数
- [x] **通过 → 进入 T-2.5**

### T-2.5 实现 Express 应用配置
- **操作：** 在 `app.ts` 中创建 Express 实例，按顺序注册：helmet → cors → compression → express.json(limit 10mb) → globalLimiter → 路由挂载点（暂为空占位） → errorHandler
- **完成标准：** 导出 app 实例，中间件注册顺序正确
- **测试：** `npm run build` 编译无错误
- **回退：** 修正中间件顺序或引用
- [x] **通过 → 进入 T-2.6**

### T-2.6 实现应用入口
- **操作：** 在 `index.ts` 中导入 app，从 dotenv 读取 PORT（默认3000），调用 `app.listen` 启动并打印日志
- **完成标准：** 启动后控制台输出端口信息
- **测试：** 运行 `npm run dev`，确认控制台打印 `Server running on port 3000`（或类似）；向 `http://localhost:3000/` 发送 GET，确认返回 JSON 格式的 404 错误（非 HTML）
- **回退：** 修正入口文件；如端口冲突则修改默认端口
- [x] **通过 → 进入 T-2.7**

### T-2.7 实现 JWT 认证中间件
- **操作：** 在 `middleware/auth.ts` 中实现：从 `Authorization: Bearer <token>` 提取 token → 用 jsonwebtoken.verify 校验（JWT_SECRET 来自 env）→ 失败返回 401 → 成功挂载 `req.admin`
- **完成标准：** 导出 auth 中间件函数
- **测试：** `npm run build` 编译无错误；在 adminRoutes 中添加临时 `GET /api/admin/test` 路由使用 auth 中间件 → 不带 Token 请求返回 `{ code: 401 }` → 用 jsonwebtoken.sign 生成一个测试 token 携带请求返回 200
- **回退：** 修正中间件逻辑；测试完成后删除临时路由
- [x] **通过 → 进入 T-2.8**

### T-2.8 实现 TypeScript 类型定义
- **操作：** 在 `types/index.ts` 中定义：扩展 Express Request 接口添加 admin 属性；定义 Product/SystemConfig/Admin 相关的请求/响应类型
- **完成标准：** 类型文件导出所有必要类型，`npm run build` 无错误
- **测试：** `npm run build` 编译无错误
- **回退：** 修正类型定义
- [x] **通过 → 进入 T-3.1**

---

## 阶段三 · 后端 API 实现

### T-3.1 实现登录接口
- **操作：** 在 `adminController` 和 `adminRoutes` 中实现 `POST /api/admin/login`，逻辑：校验非空 → 查 Admin 表 → bcrypt.compare → 成功返回 JWT token（30分钟过期） → 失败返回错误码 1001 → loginLimiter 保护
- **完成标准：** 接口可调用，正确密码返回 token，错误密码返回 1001
- **测试前置：** 启动本地 MySQL，运行 `npx prisma db push` 和 `npx prisma db seed`
- **测试：**
  1. `POST /api/admin/login` body=`{username:"admin",password:"admin123"}` → 返回含 token 字段的 JSON
  2. body=`{username:"admin",password:"wrong"}` → 返回 `code: 1001`
  3. 连续发送 6 次错误密码 → 第 6 次返回 `code: 1002`（限速）
- **回退：** 若测试 1 失败检查 seed 是否执行成功和密码哈希逻辑；若测试 3 失败检查 loginLimiter 配置
- [x] **通过 → 进入 T-3.2**

### T-3.2 实现前端产品列表接口
- **操作：** 在 `productController` 和 `productRoutes` 中实现 `GET /api/products`，支持参数：providers/sortField/sortOrder/page/pageSize/keyword/location；排除 isDeleted=true；默认按 createdAt desc；分页返回 total/page/pageSize/list
- **完成标准：** 接口返回正确结构的 JSON
- **测试：**
  1. 无参数请求 → 返回 seed 数据，page=1，pageSize=50
  2. `?sortField=price&sortOrder=asc` → 数据按价格升序
  3. `?keyword=xxx` → 仅返回名称含 xxx 的产品
  4. `?location=xxx` → 仅返回位置含 xxx 的产品
  5. `?providers=A,B` → 仅返回服务商为 A 或 B 的产品
- **回退：** 逐一修复失败的测试项对应的查询逻辑
- [x] **通过 → 进入 T-3.3**

### T-3.3 实现服务商列表接口
- **操作：** 实现 `GET /api/providers`，返回去重的服务商名称数组（排除已删除产品）
- **完成标准：** 返回字符串数组，无重复
- **测试：** 请求接口 → 返回值为数组且元素不重复；软删除一条产品后再请求，该服务商（若唯一）不出现
- **回退：** 修正查询条件
- [x] **通过 → 进入 T-3.4**

### T-3.4 实现前端配置接口
- **操作：** 实现 `GET /api/config`，查询 SystemConfig 表返回格式化对象（公告中英文、4个社交链接、标题中英文、Logo）
- **完成标准：** 返回包含 9 个配置项的结构化 JSON
- **测试：** 请求接口 → 返回 JSON 包含 announcement_zh、announcement_en、link_telegram 等字段，值与 seed 一致
- **回退：** 修正查询或响应格式
- [x] **通过 → 进入 T-3.5**

### T-3.5 实现添加产品接口
- **操作：** 实现 `POST /api/admin/products`（需 auth 中间件），校验必填字段 → 流量单位转换（TB×1000→GB）→ 带宽单位转换（Gbps×1000→Mbps）→ 货币代码校验（3位字母）→ 创建记录
- **完成标准：** 携带 Token 可成功创建产品
- **测试：**
  1. 不带 Token → 返回 401
  2. 带 Token，月流量传 `{value:1, unit:"TB"}` → 数据库存储 monthlyTraffic=1000
  3. 带宽传 `{value:0.5, unit:"Gbps"}` → 数据库存储 bandwidth=500
  4. 货币代码传 "ABCD"（4位）→ 返回校验错误
  5. 缺少必填字段 → 返回 400
- **回退：** 逐一修复对应校验或转换逻辑
- [x] **通过 → 进入 T-3.6**

### T-3.6 实现更新产品接口
- **操作：** 实现 `PUT /api/admin/products/:id`（需 auth），检查产品存在且未删除 → 更新 → 单位转换同添加
- **完成标准：** 可成功更新已有产品
- **测试：**
  1. 更新存在的产品 → 返回成功，数据库值已变更
  2. 更新不存在的 ID → 返回 `code: 2001`
  3. 更新已软删除的产品 → 返回 `code: 2001`
- **回退：** 修正存在性检查或更新逻辑
- [x] **通过 → 进入 T-3.7**

### T-3.7 实现删除产品接口
- **操作：** 实现 `DELETE /api/admin/products/:id`（需 auth），检查存在 → 软删除（isDeleted=true）
- **完成标准：** 删除后产品 isDeleted 变为 true
- **测试：**
  1. 删除存在的产品 → 返回成功，数据库 isDeleted=true
  2. 删除不存在的 ID → 返回 `code: 2001`
  3. 前端 `GET /api/products` 不再包含该产品
- **回退：** 修正软删除逻辑
- [x] **通过 → 进入 T-3.8**

### T-3.8 实现后台产品列表接口
- **操作：** 实现 `GET /api/admin/products`（需 auth），支持 keyword 搜索（匹配 provider 或 name），分页默认 20 条/页
- **完成标准：** 返回含分页信息的产品列表
- **测试：**
  1. 无参数请求 → 返回数据，pageSize=20
  2. keyword 搜索 → 返回匹配结果
  3. 翻页参数 → 分页正确
- **回退：** 修正查询或分页逻辑
- [x] **通过 → 进入 T-3.9**

### T-3.9 实现后台配置获取接口
- **操作：** 实现 `GET /api/admin/config`（需 auth），返回所有配置项列表
- **完成标准：** 返回含所有配置项的数组
- **测试：** 携带 Token 请求 → 返回 9 条配置；不带 Token → 401
- **回退：** 修正查询逻辑
- [x] **通过 → 进入 T-3.10**

### T-3.10 实现后台配置更新接口
- **操作：** 实现 `PUT /api/admin/config`（需 auth），接收 configKey + configValue → 更新对应配置项；不存在返回 3001
- **完成标准：** 可成功更新已有配置项
- **测试：**
  1. 更新 `announcement_zh` 为新值 → 成功，再 GET 确认已变
  2. 更新不存在的 key → 返回 `code: 3001`
- **回退：** 修正查询或更新逻辑
- [x] **通过 → 进入 T-4.1**

---

## 阶段四 · 前端项目初始化

### T-4.1 创建 Vite + React 项目
- **操作：** 在项目根目录运行 `npx -y create-vite@latest frontend -- --template react-ts`；进入 `frontend/` 运行 `npm install`
- **完成标准：** `frontend/package.json` 存在且含 react、vite
- **测试：** 在 `frontend/` 运行 `npm run build` 无报错
- **回退：** 删除 frontend 目录重新创建
- [x] **通过 → 进入 T-4.2**

### T-4.2 安装前端依赖
- **操作：** 在 `frontend/` 执行 `npm install antd react-router-dom axios react-i18next i18next react-markdown`
- **完成标准：** dependencies 包含以上 6 个包
- **测试：** 读取 `package.json` 确认；`npm run build` 无报错
- **回退：** 补装缺失的包
- [x] **通过 → 进入 T-4.3**

### T-4.3 创建前端目录结构
- **操作：** 在 `frontend/src/` 下创建：`api/`、`components/`、`pages/Home/`、`pages/Admin/`、`locales/`、`hooks/`、`utils/`、`types/`
- **完成标准：** 8 个目录均存在
- **测试：** 列出 `frontend/src/` 确认
- **回退：** 创建缺失目录
- [x] **通过 → 进入 T-4.4**

### T-4.4 配置 Vite 代理
- **操作：** 在 `vite.config.ts` 的 server.proxy 中添加 `/api` 代理到 `http://localhost:3000`
- **完成标准：** proxy 配置存在
- **测试：** 同时启动后端和前端，在前端页面 fetch `/api/config` 能返回后端数据
- **回退：** 修正 proxy 配置
- [x] **通过 → 进入 T-4.5**

### T-4.5 封装 Axios 实例
- **操作：** 创建 `api/index.ts`，配置 baseURL="/api"、请求拦截器（auto attach token）、响应拦截器（401 清 token 跳登录）；导出 10 个 API 方法
- **完成标准：** 文件导出 getProducts/getProviders/getConfig/login/adminGetProducts/adminAddProduct/adminUpdateProduct/adminDeleteProduct/adminGetConfig/adminUpdateConfig
- **测试：** `npm run build` 无报错
- **回退：** 修正类型或导出错误
- [x] **通过 → 进入 T-4.6**

### T-4.6 配置国际化
- **操作：** 创建 `locales/zh.json` 和 `locales/en.json`（全部 UI 文案 key 一致）；创建 `i18n.ts` 初始化文件（默认 zh，从 localStorage 读 lang 偏好）
- **完成标准：** 两个 JSON key 集合完全一致；i18n 初始化文件导出正确
- **测试：** `npm run build` 无报错；用脚本对比两个 JSON 的 key 集合确认相同
- **回退：** 补齐缺失的 key
- [x] **通过 → 进入 T-5.1**

---

## 阶段五 · 前端展示页面

### T-5.1 实现 Header 组件
- **操作：** 创建 `components/Header.tsx`：Logo+标题（从 API 获取）、4 个社交图标链接、语言切换按钮（保存到 localStorage）
- **完成标准：** 组件渲染 Logo、4 图标、语言按钮
- **测试：** 浏览器访问确认元素可见；点击语言切换文字变化；刷新后语言保持；窗口 <768px 布局不溢出
- **回退：** 修正渲染或样式问题
- [x] **通过 → 进入 T-5.2**

### T-5.2 实现公告栏组件
- **操作：** 创建 `components/Announcement.tsx`：根据语言显示对应公告、Markdown 渲染、浅黄色背景、空则隐藏、移动端可折叠
- **完成标准：** 组件正确渲染 Markdown 公告
- **测试：** 后台设置含 Markdown 的公告 → 前端正确渲染；公告为空 → 区域不显示；移动端可折叠展开
- **回退：** 修正渲染逻辑或样式
- [x] **通过 → 进入 T-5.3**

### T-5.3 实现筛选搜索组件
- **操作：** 创建 `components/FilterBar.tsx`：服务商多选下拉（数据从 API 加载）、产品名搜索框、位置搜索框、清空按钮；移动端使用 Drawer
- **完成标准：** 四个控件可见可操作
- **测试：** 服务商下拉加载选项；搜索触发回调；清空重置全部条件；移动端 Drawer 可打开关闭
- **回退：** 修正对应控件逻辑
- [x] **通过 → 进入 T-5.4**

### T-5.4 实现桌面端产品表格
- **操作：** 创建 `pages/Home/ProductTable.tsx`：12 列（Ant Design Table）、单位转换显示（月流量 ÷1000=TB、带宽 ÷1000=Gbps、价格=值+货币）、6 列可排序、价格列 tooltip、测评超链接、下单按钮、分页 50 条/页、列头 i18n
- **完成标准：** 表格正确渲染所有列
- **测试：**
  1. 数据库存 1000GB → 表格显示 1.00TB ✓
  2. 数据库存 500Mbps → 表格显示 0.50Gbps ✓
  3. 点击 CPU 列头 → 数据排序变化 ✓
  4. 价格列 hover 出现 tooltip ✓
  5. 测评链接点击新窗口打开 ✓
  6. 下单按钮点击新窗口打开 ✓
  7. 翻页功能正常 ✓
  8. 切换语言列头变化 ✓
- **回退：** 逐一修复失败的测试项
- [x] **通过 → 进入 T-5.5**

### T-5.5 实现移动端产品卡片
- **操作：** 创建 `pages/Home/ProductCard.tsx`：卡片展示全部字段、下单按钮醒目、排序下拉框、触摸目标 ≥44x44px
- **完成标准：** <768px 时显示卡片而非表格
- **测试：** 窗口 375px 显示卡片布局；所有字段可见；下单按钮可点击；排序下拉可用
- **回退：** 修正卡片布局或响应式切换
- [x] **通过 → 进入 T-5.6**

### T-5.6 组装首页
- **操作：** 在 `pages/Home/index.tsx` 中组装 Header + Announcement + FilterBar + ProductTable/ProductCard，管理全部状态，页面加载时调用 API
- **完成标准：** 首页完整显示所有模块
- **测试：** 筛选+排序+搜索+分页+语言切换联动正常；桌面端和移动端均可用
- **回退：** 修正状态管理或组件装配
- [x] **通过 → 进入 T-6.1**

---

## 阶段六 · 后台管理页面

### T-6.1 实现登录页面
- **操作：** 创建 `pages/Admin/Login.tsx`：居中表单（用户名+密码+登录按钮）、Ant Design Form 校验、调用 login API、成功存 token 跳转 `/admin/products`
- **完成标准：** 登录流程完整
- **测试：** 空字段提交显示校验错误；正确密码跳转后台；错误密码显示提示
- **回退：** 修正表单逻辑或 API 调用
- [x] **通过 → 进入 T-6.2**

### T-6.2 实现路由守卫和后台布局
- **操作：** 创建 `AuthGuard.tsx`（无 token 跳登录）和 `AdminLayout.tsx`（侧边栏+顶栏+内容区）；在 `App.tsx` 配置全部路由
- **完成标准：** 路由保护生效，后台布局正确
- **测试：** 未登录访问 `/admin/products` → 跳转登录；登录后侧边栏菜单可切换页面；退出登录清 token 跳转
- **回退：** 修正路由配置或守卫逻辑
- [x] **通过 → 进入 T-6.3**

### T-6.3 实现产品管理页面
- **操作：** 创建 `pages/Admin/Products.tsx`：列表表格(分页20条)+搜索+添加 Modal(含单位选择器)+编辑 Modal(预填)+删除 Popconfirm
- **完成标准：** CRUD 全流程可用
- **测试：** 添加产品（1TB 流量）→ 列表新增；编辑预填数据正确 → 保存成功；删除二次确认 → 产品消失；搜索+分页正常
- **回退：** 逐一修复 CRUD 功能
- [x] **通过 → 进入 T-6.4**

### T-6.4 实现公告管理页面
- **操作：** 创建 `pages/Admin/Announcement.tsx`：Tabs 中英文、textarea + react-markdown 实时预览、保存按钮
- **完成标准：** 公告编辑和预览可用
- **测试：** 输入 Markdown 右侧实时渲染；保存后前端首页公告更新；中英文独立管理
- **回退：** 修正编辑器或保存逻辑
- [x] **通过 → 进入 T-6.5**

### T-6.5 实现配置管理页面
- **操作：** 创建 `pages/Admin/Settings.tsx`：4 个社交链接输入框 + 标题中英文 + Logo URL + 保存按钮
- **完成标准：** 配置修改可保存
- **测试：** 修改 Telegram 链接 → 保存 → 前端首页图标链接更新；修改网站标题 → 前端标题更新
- **回退：** 修正表单或 API 调用
- [x] **通过 → 进入 T-7.1**

---

## 阶段七 · 样式与体验优化

### T-7.1 全局主题和样式
- **操作：** 配置 Ant Design ConfigProvider 主题色；创建全局 CSS（字体 Inter/Noto Sans SC、配色、断点变量）；表格行 hover 高亮；按钮过渡动画
- **完成标准：** 全站视觉统一、有交互反馈
- **测试：** 逐页视觉审查；表格行 hover 变色；按钮有过渡效果
- **回退：** 修正样式
- [x] **通过 → 进入 T-7.2**

### T-7.2 移动端适配验证
- **操作：** 在 375px/390px/768px 三个宽度下逐页检查布局，修复溢出、按钮过小、筛选不可用等问题
- **完成标准：** 三个宽度下所有页面可用
- **测试：** 每个宽度截图对比，确认无横向滚动、无元素溢出、交互正常
- **回退：** 修正响应式 CSS
- [x] **通过 → 进入 T-7.3**

### T-7.3 错误处理与加载状态
- **操作：** 所有 API 请求添加 Spin/Skeleton 加载态；失败显示 message 提示；空表格显示空状态；Token 过期自动跳登录
- **完成标准：** 加载、错误、空态均有友好提示
- **测试：** 停止后端 → 前端显示错误提示（非白屏）；表格无数据 → 显示空状态文字；使用过期 Token → 自动跳转登录
- **回退：** 补全缺失的状态处理
- [x] **通过 → 进入 T-8.1**

---

## 阶段八 · Docker 部署配置

### T-8.1 编写后端 Dockerfile
- **操作：** 创建 `backend/Dockerfile`：多阶段构建（node:20-alpine），第一阶段 npm install + tsc + prisma generate，第二阶段仅复制产物，启动命令先 migrate deploy 后 node
- **完成标准：** Dockerfile 语法正确
- **测试：** 运行 `docker build -t vps-backend ./backend` 构建成功；镜像大小 <300MB
- **回退：** 修正 Dockerfile 指令
- [x] **通过 → 进入 T-8.2**

### T-8.2 编写 Nginx 配置
- **操作：** 创建 `docker/nginx/default.conf`：监听 80、SPA fallback、`/api` 反向代理到 `http://backend:3000`、gzip、静态缓存
- **完成标准：** 配置文件语法正确
- **测试：** 使用 `nginx -t -c` 检查配置语法（可在临时容器中执行）
- **回退：** 修正 Nginx 配置语法
- [x] **通过 → 进入 T-8.3**

### T-8.3 编写前端 Dockerfile
- **操作：** 创建 `docker/frontend/Dockerfile`：第一阶段 node:20-alpine 构建前端；第二阶段 nginx:alpine 复制产物 + 复制 Nginx 配置
- **完成标准：** Dockerfile 存在
- **测试：** `docker build -t vps-frontend -f docker/frontend/Dockerfile .` 构建成功
- **回退：** 修正 Dockerfile 路径或指令
- [x] **通过 → 进入 T-8.4**

### T-8.4 编写 docker-compose.yml
- **操作：** 定义三个服务：db（mysql:8.0，health check，volume）、backend（依赖 db healthy，不暴露端口）、frontend（映射 80:80，依赖 backend）；定义 volume 和 network
- **完成标准：** 配置文件语法正确
- **测试：** `docker-compose config` 无报错
- **回退：** 修正 YAML 语法
- [x] **通过 → 进入 T-8.5**

### T-8.5 编写环境变量示例
- **操作：** 填写 `.env.example`，列出全部环境变量：MYSQL_ROOT_PASSWORD、MYSQL_DATABASE、MYSQL_USER、MYSQL_PASSWORD、JWT_SECRET、DATABASE_URL（模板）、PORT
- **完成标准：** 所有变量有说明注释
- **测试：** 对比 docker-compose.yml 中引用的变量，确认 .env.example 全部覆盖
- **回退：** 补齐缺失变量
- [x] **通过 → 进入 T-8.6**

### T-8.6 生成 Prisma 迁移文件
- **操作：** 连接本地 MySQL 运行 `npx prisma migrate dev --name init`
- **完成标准：** `backend/prisma/migrations/` 下生成迁移目录和 SQL 文件
- **测试：** 在干净 MySQL 上运行 `npx prisma migrate deploy` → 三张表创建成功
- **回退：** 修正 schema 后重新生成迁移
- [x] **通过 → 进入 T-9.1**

---

## 阶段九 · 集成测试与验证

### T-9.1 Docker Compose 全栈启动
- **操作：** 复制 `.env.example` 为 `.env` 填入实际值 → `docker-compose up -d --build` → 等待所有容器 healthy
- **完成标准：** 三个容器均为 Up 状态
- **测试：**
  1. `docker-compose ps` → 三个服务 Up
  2. `docker-compose logs db` → 无致命错误
  3. `docker-compose logs backend` → 显示迁移成功 + 端口监听
  4. `docker-compose logs frontend` → Nginx 启动正常
- **回退：** 查看失败容器日志 → 返回对应阶段修复 → 重新 build
- [x] **通过 → 进入 T-9.2**

### T-9.2 端到端功能验证（前端展示）
- **操作：** 逐一执行以下 11 项检查：
  1. 访问 `http://localhost` → 首页加载，表格有数据
  2. 切换 English → 界面文字英文，刷新保持
  3. 产品名称搜索 → 结果过滤正确
  4. 位置搜索 → 结果过滤正确
  5. 服务商筛选 → 结果过滤正确
  6. 清空筛选 → 恢复全部
  7. 价格排序 → 数据重排
  8. 翻页 → 分页正常
  9. 测评链接 → 新窗口打开
  10. 下单链接 → 新窗口打开
  11. 窗口缩至移动端 → 卡片布局
- **完成标准：** 11/11 通过
- **测试：** 任一项失败记录编号 → 返回对应步骤修复后重验该项
- **回退：** 根据失败项编号回溯：1→T-5.6，2→T-4.6/T-5.1，3→T-5.3/T-3.2，4→T-5.3/T-3.2，5→T-5.3/T-3.2，6→T-5.3，7→T-5.4/T-3.2，8→T-5.4，9→T-5.4，10→T-5.4，11→T-5.5
- [x] **通过 → 进入 T-9.3**

### T-9.3 端到端功能验证（后台管理）
- **操作：** 逐一执行以下 9 项检查：
  1. 访问 `/admin/login` → 登录页可见
  2. admin/admin123 登录 → 跳转后台
  3. 添加产品(1TB流量) → 出现在列表
  4. 编辑产品修改价格 → 保存成功
  5. 删除产品 → 二次确认后消失
  6. 前端首页 → 新增可见、删除不可见
  7. 修改公告(含 Markdown) → 前端渲染正确
  8. 修改社交链接 → 前端 Header 更新
  9. 退出登录 → 返回登录页
- **完成标准：** 9/9 通过
- **测试：** 任一项失败记录编号 → 返回对应步骤修复
- **回退：** 根据失败项编号回溯：1→T-6.1，2→T-3.1/T-6.1，3→T-6.3/T-3.5，4→T-6.3/T-3.6，5→T-6.3/T-3.7，6→T-3.2，7→T-6.4/T-5.2，8→T-6.5/T-5.1，9→T-6.2
- [x] **通过 → 进入 T-9.4**

### T-9.4 安全性验证
- **操作：** 逐一执行以下 6 项检查：
  1. 无 Token 访问所有 `/api/admin/*` → 全部 401
  2. 过期 Token 访问 → 401
  3. 连续错误密码 → 触发限速
  4. 响应头含 helmet 安全头（X-Content-Type-Options 等）
  5. 跨域请求被限制
  6. 生产错误响应无堆栈信息
- **完成标准：** 6/6 通过
- **测试：** 任一项失败返回对应中间件修复
- **回退：** 1-2→T-2.7，3→T-2.4/T-3.1，4→T-2.5，5→T-2.5，6→T-2.3
- [x] **通过 → 进入 T-10.1**

---

## 阶段十 · 文档编写

### T-10.1 编写部署文档
- **操作：** 创建 `docs/deployment.md`：环境要求、环境变量说明、启动命令、服务管理、数据备份、SSL 配置、常见问题
- **完成标准：** 文档包含以上 7 个章节
- **测试：** 按文档步骤在脑中"干跑"一遍，确认无遗漏步骤和自相矛盾
- **回退：** 补全缺失章节
- [x] **通过 → 进入 T-10.2**

### T-10.2 编写 API 文档
- **操作：** 创建 `docs/api.md`：覆盖全部 10 个 API 接口（路径、方法、参数、请求体、响应格式、错误码、示例）
- **完成标准：** 10 个接口文档齐全
- **测试：** 对比 `backend/src/routes/` 中实际路由，确认无遗漏接口
- **回退：** 补全遗漏接口文档
- [x] **通过 → 进入 T-10.3**

### T-10.3 编写管理员手册
- **操作：** 创建 `docs/admin-guide.md`：登录流程、产品管理（增删改查）、公告管理、配置管理操作说明
- **完成标准：** 覆盖所有后台功能
- **测试：** 对比后台页面功能列表，确认无遗漏
- **回退：** 补全遗漏功能说明
- [x] **通过 → 进入 T-10.4**

### T-10.4 编写项目 README
- **操作：** 更新根目录 `README.md`：项目简介、技术栈、快速开始（本地开发+Docker部署）、目录结构、文档链接
- **完成标准：** README 包含以上 5 个章节
- **测试：** 确认所有文档链接路径正确
- **回退：** 修正错误链接或缺失章节
- [x] **✅ 全部完成**

---

## 执行统计

| 阶段 | 任务数 | 范围 |
|------|--------|------|
| 阶段〇 项目结构 | 2 | T-0.1 ~ T-0.2 |
| 阶段一 后端初始化 | 12 | T-1.1 ~ T-1.12 |
| 阶段二 后端架构 | 8 | T-2.1 ~ T-2.8 |
| 阶段三 后端 API | 10 | T-3.1 ~ T-3.10 |
| 阶段四 前端初始化 | 6 | T-4.1 ~ T-4.6 |
| 阶段五 前端展示 | 6 | T-5.1 ~ T-5.6 |
| 阶段六 后台管理 | 5 | T-6.1 ~ T-6.5 |
| 阶段七 样式优化 | 3 | T-7.1 ~ T-7.3 |
| 阶段八 Docker 部署 | 6 | T-8.1 ~ T-8.6 |
| 阶段九 集成测试 | 4 | T-9.1 ~ T-9.4 |
| 阶段十 文档编写 | 4 | T-10.1 ~ T-10.4 |
| **合计** | **66** | |

> [!IMPORTANT]
> **铁律：每一项 `[ ]` 的测试必须全部通过后才可勾选并进入下一项。未通过时执行回退操作修复后重新测试，严禁跳步。**
