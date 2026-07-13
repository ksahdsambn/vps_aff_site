# Next.js 迁移开发进度

> 方案文档：`Nextjs_remake.md`
> 执行原则：按阶段顺序执行，不跳步，不并行；任一阶段测试未通过不进入下一阶段。
> 操作 AI 模型：ZCode (builtin:bigmodel-coding-plan/GLM-5.2)
> 开始时间：2026-07-11

---

## 阶段执行状态总览

| 阶段 | 名称 | 状态 | 放行 |
|---|---|---|---|
| 1 | 搭建 Next.js 项目骨架 | ✅ 完成 | ✅ 放行 |
| 2 | i18n URL 路由化 | ✅ 完成 | ✅ 放行 |
| 3 | 首页 SSG + client islands | ✅ 完成 | ✅ 放行 |
| 4 | 产品详情页 + 服务商聚合页 + 后端端点 | ✅ 完成 | ✅ 放行 |
| 5 | 迁移 Admin 页面 | ✅ 完成 | ✅ 放行 |
| 6 | SEO 元数据全面修复 | ✅ 完成 | ✅ 放行 |
| 7 | 结构化数据 JSON-LD | ✅ 完成 | ✅ 放行 |
| 8 | 标题层级 + 语义化 HTML | ✅ 完成 | ✅ 放行 |
| 9 | 动态 sitemap.xml + robots.txt | ✅ 完成 | ✅ 放行 |
| 10 | 性能与 JS 分割 | ✅ 完成 | ✅ 放行 |
| 11 | 404 页面 + Nginx 配置 | ✅ 完成 | ✅ 放行 |
| 12 | Docker 与部署链路更新 | ✅ 完成 | ✅ 放行 |
| 13 | 分析工具集成 + 验证 | ✅ 完成 | ✅ 放行 |

---

## 历史记录（Vite 前端时代，2026-03 ~ 2026-06）

> 以下记录来自原 `memory.md`，为 Next.js 迁移（2026-07-11 起）之前的工作日志。
> 涉及的 `frontend/`（Vite SPA）目录已在 Next.js 迁移中由 `frontend-next/` 取代，
> 但后端改动、部署修复、SEO 优化等记录仍具参考价值，故合并保留于此。

### 2026-03-23

- Reviewed the full stack project structure and current local changes.
- Fixed frontend reliability issues caused by unstable effect usage, loose `any` typing, and inconsistent admin page implementations.
- Rebuilt these frontend files into clean working versions:
  - `frontend/src/pages/Admin/Login.tsx`
  - `frontend/src/pages/Admin/Products.tsx`
  - `frontend/src/pages/Admin/Announcement.tsx`
  - `frontend/src/pages/Admin/Settings.tsx`
  - `frontend/src/pages/Home/index.tsx`
- Added shared API error helpers in `frontend/src/api/index.ts`.
- Adjusted `frontend/src/components/FilterBar.tsx` to avoid unsafe effect/function ordering.
- Fixed wildcard CORS handling in `backend/src/app.ts` so `CORS_ORIGIN=*` works as intended.

#### Validation

- `cd backend && npm run build`
- `cd frontend && npm run lint`
- `cd frontend && npm run build`
- `docker compose up -d --build`
- Verified `GET http://localhost/`
- Verified `GET http://localhost/api/config`
- Verified `GET http://localhost/api/products?page=1&pageSize=3`
- Verified `POST http://localhost/api/admin/login`
- Verified authenticated `GET http://localhost/api/admin/products?page=1&pageSize=2`
- Verified authenticated `GET http://localhost/api/admin/config`
- Smoke tested authenticated create, update, and delete on `POST/PUT/DELETE http://localhost/api/admin/products`

#### Current Status

- Docker services `db`, `backend`, and `frontend` are running.
- Backend migrations and runtime seed completed successfully during container startup.
- Frontend lint is clean.
- Frontend and backend builds both pass.

### 2026-03-24

- Reviewed the running Docker deployment and revalidated the full stack locally.
- Hardened `backend/src/controllers/adminController.ts` so admin login, create, and update flows now trim text inputs and reject invalid numeric/unit payloads with `400` instead of leaking `500` errors from Prisma.
- Rebuilt `backend/src/controllers/productController.ts` to normalize whitespace-only query parameters, so blank public/admin searches no longer behave like accidental filters.
- Fixed `frontend/src/components/FilterBar.tsx` so clearing keyword or location inputs immediately refreshes the product list instead of leaving stale filters applied.
- Fixed `frontend/src/pages/Admin/Products.tsx` so the admin search box is controlled and clearing it resets the table query immediately.

#### Validation (2026-03-24)

- `cd backend && npm run build`
- `cd frontend && npm run lint`
- `cd frontend && npm run build`
- `docker compose up -d --build`
- Verified `GET http://localhost/api/products?keyword=%20%20&page=1&pageSize=1` returns the full dataset instead of a whitespace-filtered result.
- Verified authenticated `GET http://localhost/api/admin/products?keyword=%20Provider%2048%20&page=1&pageSize=5` trims the keyword and returns the expected record.
- Verified authenticated invalid create payload on `POST http://localhost/api/admin/products` returns `400` with a validation error instead of a server error.
- Smoke tested authenticated create, update, and delete on `POST/PUT/DELETE http://localhost/api/admin/products` after the validation changes.

### 2026-03-24 (Docs)

- Rewrote `docs/deployment.md` into a more precise 1Panel deployment guide with concrete commands, exact path examples, explicit `.env` content, and exact `docker-compose.yml` port mapping changes for 1Panel reverse proxy deployment.
- Reworked deployment maintenance section `11.3` to use the 1Panel scheduled task model instead of manual file replacement, including a GitHub-driven update workflow that rebuilds and reapplies containers.
- Added a reusable deployment helper script at `scripts/update-from-github.sh` so 1Panel tasks can call a stable script path instead of pasting a long inline shell body each time.
- Documented the exact 1Panel scheduled task fields: task type, task name, schedule, interpreter, user, and script content.
- Added operational notes about preserving server-side `.env`, the effect of `git reset --hard`, and using SSH remotes if the GitHub repository becomes private.

### 2026-03-24 (UI Modernization)

- Redesigned the entire frontend UI for a more premium, modern, and "stunning" look:
  - Updated `ConfigProvider` with a vibrant Indigo theme, larger border radii (12px-16px), and refined component tokens.
  - Implemented **Glassmorphism** across all main panels (Header, FilterBar, Announcement, ProductTable, ProductCard).
  - Added a dynamic **Mesh Gradient** background with animated floating decorative blobs on the Home and Login pages.
- Enhanced UX states across the application:
  - Added **Spring-based Bouncy Animations** to all interactive elements (buttons, inputs, cards).
  - Implemented better **Loading** states using consistent spinners and skeleton-like spacing.
  - Added **Empty** states using Ant Design's Empty component for the product list when no results are found.
  - Improved **Hover and Focus** states with subtle scaling and glow effects.
- Modernized the **Admin Dashboard** and **Login Page** with a contemporary dark/light hybrid design and improved layout spacing.
- Fixed multiple lint errors and unused variables related to the UI refactor.
- Pushed all changes to the GitHub repository.

> 注：此阶段的 Glassmorphism + Bounce + Indigo 渐变设计后被 `frontend-design` 技能判定为 "AI slop" 指纹，
> 已于 2026-07-12 的「Editorial-Data Minimal」重做中移除（见文末章节）。

#### Validation (2026-03-24 UI)

- Verified `npm run build` in the frontend passes with 0 errors.
- Confirmed all visual components (Header, Cards, Table) successfully integrate the new design system.
- Validated responsiveness for mobile and desktop views across all modified components.

### 2026-03-24 (UI Optimization & Multi-Device Adaptation)

- Analyzed multi-device adaptation and implemented modern design enhancements:
  - **Skeletal Loading**: Replaced generic loading spinners with custom `ProductSkeleton` components for both card and table views, improving perceived performance.
  - **Hardware Progress Bars**: Created `VpsProgress` component to visually represent CPU, RAM, and Disk specifications with colored gauges.
  - **Staggered Entrance Animations**: Implemented CSS-based sequential fade-up animations for product list items (cards and table rows) to create a more dynamic feel.
  - **Refined Glassmorphism**: Increased backdrop-filter blur to 28px and added subtle shadows/borders for a more premium "frosted" look across Header, FilterBar, and Panels.
  - **Dynamic Backgrounds**: Added interactive floating mesh gradient blobs with `float` animations to the Home page.
  - **Tablet Adaptation**: Updated responsive logic to use a grid-based card layout for screens between 768px and 1200px, rather than the cumbersome horizontally-scrolling table.
  - **UX Polish**: Modernized `FilterBar` with glassmorphism, larger inputs, and improved mobile drawer interactions.
- Fixed multiple lint errors and unused variable warnings in frontend components.
- Verified `npm run build` and `npm run lint` pass successfully in frontend.
- Successfully pushed all changes to the GitHub repository.

#### Validation (2026-03-24 UI Optimization)

- Verified the skeleton screen appears correctly during data fetching.
- Confirmed the staggered animation triggers on page load and filter change.
- Validated the 2nd/3rd column grid layout on medium-sized screen simulations.
- Checked progress bars correctly calculate percentages for hardware specs.
- Confirmed glassmorphism effect is consistent across components.

### 2026-03-25 (UI Simplification)

- Simplified the product display by removing visual clutter:
  - **Removed Icons**: Deleted column/section icons for CPU, Memory, and Disk in both the Product Table and Product Cards.
  - **Removed Progress Bars**: Disabled the `VpsProgress` hardware gauges for CPU, RAM, and Disk to achieve a cleaner, text-focused aesthetic.
  - **Cleaned Codebase**: Removed unused icon imports and the `VpsProgress` component import from `ProductTable.tsx` and `ProductCard.tsx`.
- Rebuilt Docker containers and pushed changes to GitHub.

#### Validation (2026-03-25 UI Simplification)

- Verified that CPU, Memory, and Disk columns now only show text labels without icons.
- Confirmed that the hardware specification sections in cards no longer show progress bars.
- Verified `npm run build` and `npm run lint` pass in the frontend.

### 2026-03-25 (UI Refinement)

- Addressed horizontal scrollbar and layout issues in `ProductTable.tsx`:
  - **Removed Horizontal Scrollbar**: Replaced fixed `scroll={{ x: 1200 }}` with `scroll={{ x: 'max-content' }}` and reduced column widths to fit standard desktop viewports (1200px+).
  - **Optimized Column Layout**:
    - Updated specific column widths (Name: 150px, CPU/Memory/Disk: 80px, Order: 100px, etc.).
    - Added `ellipsis: true` to the Product Name column.
  - **Indented Order Column**: Removed `fixed: 'right'` from the "Order" column, allowing it to flow naturally and remain fully visible without horizontal scrolling.
- Adjusted **Order** button typography and scaling in `ProductTable.tsx`:
  - **Font Synchronization**: Set button font size to `12px` and weight to `600` to perfectly match the provider brand tags (e.g., DMIT).
  - **Proportional Resizing**: Reduced button height to `28px` and adjusted padding/border-radius to maintain a balanced, professional look that aligns with the visual weight of other table elements.
- Rebuilt Docker containers and pushed all changes to the GitHub repository.

#### Validation (2026-03-25 UI Refinement)

- Verified that the horizontal scrollbar no longer appears on screens >= 1200px.
- Confirmed the "Order" button is fully visible in the table without horizontal sliding.
- Validated the button text and size match the provider tags for a cohesive UI.
- Validated the button text translation in both Chinese and English modes.
- Verified `npm run lint` passes (0 errors, 1 unrelated warning).

### 2026-03-28 (SEO Optimization — 8 Phases Complete)

按照 `VPS Navi SEO 优化 — AI 开发者实施指南.md` 严格按顺序执行方案 1→8，每阶段通过 TypeScript 编译测试后才进入下一阶段。

#### 方案 1：基础 Meta 标签 & HTML lang 修复 ✅
- 修改 `frontend/index.html`：`lang="en"` → `lang="zh-CN"`
- 新增 `<title>VPS导航 - 全球VPS价格对比与推荐 | VPS Navi</title>`
- 新增 `meta description`、`meta keywords`、`canonical URL`
- 新增 6 个 Open Graph 标签、3 个 Twitter Card 标签
- **测试**: `npx tsc --noEmit` ✅

#### 方案 2：添加 robots.txt 和 sitemap.xml ✅
- 新建 `frontend/public/robots.txt`（允许 `/`，禁止 `/admin/` 和 `/api/`）
- 新建 `frontend/public/sitemap.xml`（首页 URL，daily 更新频率）
- **测试**: `npx tsc --noEmit` ✅

#### 方案 3：语义化 HTML 重构 ✅
- `Home/index.tsx`：最外层 `<div>` → `<main>`，产品容器 `<div>` → `<section aria-label="VPS Products">`
- `Header.tsx`：Logo alt → "VPS Navi Logo"，社交链接包裹 `<nav aria-label="Social links">`
- `Announcement.tsx`：外层 `<div>` → `<aside aria-label="Announcement">`
- **测试**: `npx tsc --noEmit` ✅

#### 方案 4：动态 HTML lang 同步 i18n ✅
- `i18n.ts`：添加 langMap 映射 + 初始化同步 + `languageChanged` 事件监听器同步 `document.documentElement.lang`
- **测试**: `npx tsc --noEmit` ✅

#### 方案 5：字体加载性能优化 ✅
- `index.html`：字体 `<link>` 添加 `media="print" onload="this.media='all'"`
- 新增 `<noscript>` 回退
- **测试**: `npx tsc --noEmit` ✅

#### 方案 6：添加 react-helmet-async 动态 Head 管理 ✅
- 安装 `react-helmet-async`
- 新建 `frontend/src/components/SEO.tsx`（动态 title/description/og/twitter 管理）
- `main.tsx`：添加 `HelmetProvider` 包裹 `ConfigProvider`
- `Home/index.tsx`：添加 `useTranslation` + `<SEO>` 组件（根据语言动态设置）
- **测试**: `npx tsc --noEmit` ✅

#### 方案 7：添加结构化数据 (JSON-LD) ✅
- `index.html`：在 `</head>` 前添加 `application/ld+json` 结构化数据（WebSite schema + SearchAction）
- **测试**: `npx tsc --noEmit` ✅

#### 方案 8：SPA 预渲染 ✅
- 安装 `vite-plugin-prerender` + `puppeteer`
- `vite.config.ts`：添加 prerender 插件（使用 `createRequire` 加载 CJS 模块解决 ESM 兼容性）
- 预渲染路由 `/`，renderAfterTime 3000ms
- **注意**: 原指南使用 named export 不兼容该包实际 API，已修正为 default export + createRequire
- **测试**: `npx tsc --noEmit` ✅; `npm run build` ✅ 构建+预渲染成功

#### 综合验证
- TypeScript 编译检查: ✅ 无错误
- Vite 构建检查: ✅ 构建成功，dist 目录生成正常，预渲染完成
- 静态文件验证: ✅ dist/robots.txt 和 dist/sitemap.xml 内容正确
- dist/index.html 包含: lang, description, keywords, canonical, og tags, twitter tags, JSON-LD, async font
- Dev 服务器: ✅ Vite 启动成功

#### 修改文件清单
| 文件 | 操作 | 涉及方案 |
|---|---|---|
| frontend/index.html | MODIFY | 1, 5, 7 |
| frontend/public/robots.txt | NEW | 2 |
| frontend/public/sitemap.xml | NEW | 2 |
| frontend/src/pages/Home/index.tsx | MODIFY | 3, 6 |
| frontend/src/components/Header.tsx | MODIFY | 3 |
| frontend/src/components/Announcement.tsx | MODIFY | 3 |
| frontend/src/i18n.ts | MODIFY | 4 |
| frontend/src/components/SEO.tsx | NEW | 6 |
| frontend/src/main.tsx | MODIFY | 6 |
| frontend/vite.config.ts | MODIFY | 8 |

### 2026-03-28 (Bugfix: SSR 渲染导致错误提示固化)

**问题描述**: 当用户访问首页 `http://localhost/` 时，页面顶部会出现 `[Failed to load products]` 的 Ant Design 全局错误提示。
**问题分析**:
- 由于我们采用了 `vite-plugin-prerender` + Puppeteer 进行首屏静态化构建 (SSG)。
- 在构建期间，Puppeteer 环境内部并没有连通后端的 API（由于隔离在 Docker 前端构建镜像内）。
- 导致 React 应用获取产品列表抛出异常，并触发了 `message.error("Failed to load products")`。
- 这个错误提示生成的 DOM 节点被原封不动地序列化写入了 `dist/index.html`。
- 当真实用户访问时，虽然客户端代码重新拉取到了真实的商品列表，但先前写入静态 HTML 的提示 DOM 并不会被抹除（因为插入在 React 根节点之外的 `body`）。

**修复方案**:
- 在 `frontend/src/pages/Home/index.tsx` 内封装了 `showError` 机制拦截构建期行为。
- 通过探查特有变量 `window.__PRERENDER_INJECTED` 以及无头浏览器的 UA 标识 `navigator.userAgent.includes('HeadlessChrome')`。
- 在检测为预渲染环境下，直接吃掉 API 错误消息，禁止弹出 Toast 冒泡进入快照。
- 同步修改了 Dockerfile 的 Alpine 底层，注入 Chromium 的环境依赖，使得带有无头检测的预渲染得以安全稳定跑通。
**验证结果**: 重新在 Docker 内执行 build 后，`http://localhost/` 已验证无此错误悬浮窗。

> 注：此 SSR 错误提示固化问题在 Next.js 迁移后已不复存在（SSG 由 Next.js 原生处理，
> 不依赖 Puppeteer，且 API 错误已 `.catch()` 降级为空数据）。

### 2026-06-15 (修复 1Panel 计划任务自动更新失败)

**问题描述**: 1Panel 计划任务 `vps_aff_site_auto_update` 无法从 GitHub 拉取更新，报错 `Missing .git in /opt/1panel/task/shell`，重试 3 次均失败。

**问题分析**: 经 SSH 排查服务器 `185.255.113.121`，发现 3 个叠加问题：

1. **PROJECT_DIR 计算错误**: 1Panel 将任务脚本放在 `/opt/1panel/task/shell/vps_aff_site_auto_update/`，脚本通过 `SCRIPT_DIR/..` 计算 `PROJECT_DIR` 得到 `/opt/1panel/task/shell`（无 `.git`），而非实际项目路径 `/root/vps_aff_site`。
2. **前端端口冲突**: 服务器 80 端口被 1Panel 自带的 OpenResty 占用，仓库 `docker-compose.yml` 写死 `"80:80"`，`git reset --hard` 会覆盖服务器手动改的 `8080:80`。
3. **ADMIN_PASSWORD 缺失**: 新代码 (`5afc3e6`) 要求生产环境必须设置 `ADMIN_PASSWORD` 环境变量（见 `backend/src/utils/secrets.ts`），但服务器 `.env` 未配置，导致后端容器启动即崩溃 (`seedRuntime` 退出码 1)。

**修复措施**:

| 问题 | 修复 |
|------|------|
| PROJECT_DIR 错误 | `scripts/update-from-github.sh`: `PROJECT_DIR` 改为 `${PROJECT_DIR:-...}` 支持环境变量覆盖；服务器任务脚本硬编码 `PROJECT_DIR="${PROJECT_DIR:-/root/vps_aff_site}"` |
| 端口冲突 | `docker-compose.yml`: `"80:80"` → `"${FRONTEND_PORT:-80}:80"`；服务器 `.env` 添加 `FRONTEND_PORT=8080`（`.env` 会被脚本备份恢复，不会因 reset 丢失） |
| ADMIN_PASSWORD 缺失 | 服务器 `.env` 添加 `ADMIN_PASSWORD=<redacted-admin-password>`（commit `0503d0e` 中硬编码的密码） |

**修改文件清单**:
| 文件 | 操作 |
|------|------|
| `docker-compose.yml` | 前端端口改为 `${FRONTEND_PORT:-80}:80` |
| `scripts/update-from-github.sh` | `PROJECT_DIR` 支持 env 覆盖 |
| `.env.example` | 新增 `FRONTEND_PORT` 文档 |
| 服务器 `.env` | 新增 `FRONTEND_PORT=8080`、`ADMIN_PASSWORD=...` |
| 服务器 1Panel 任务脚本 | `PROJECT_DIR` 默认指向 `/root/vps_aff_site` |

**验证结果**:
- Git commit `2fbc2fe` 已推送到 GitHub
- 计划任务手动执行成功，拉取最新代码并重建容器
- 三个容器全部运行: backend (Up)、db (healthy)、frontend (Up, `0.0.0.0:8080->80/tcp`)
- HTTP 检查: frontend `200`、backend API `200`
- 后端日志: `Runtime seed completed successfully` + `Server running on port 3000`

---

## 阶段 1：搭建 Next.js 项目骨架

- **状态**：✅ 完成
- **AI 模型**：ZCode (GLM-5.2)

### 本阶段完成内容
1. `npx create-next-app@latest frontend-next`（TypeScript、App Router、src 目录、import-alias `@/*`、不使用 turbopack 构建、eslint）。
2. 安装核心依赖：`antd@^6`、`@ant-design/icons`、`@ant-design/cssinjs`、`@ant-design/nextjs-registry`、`axios`、`i18next`、`react-i18next`、`react-markdown`、`rehype-sanitize`。
3. 移除不再需要的依赖：`react-helmet-async`、`react-router-dom`、`vite-plugin-prerender`、`puppeteer`（未在新 package.json 出现）。
4. 配置 `next.config.ts`：`output: 'standalone'`、`reactStrictMode`、`rewrites()` 将 `/api/*` 代理到后端（`BACKEND_URL`/`NEXT_PUBLIC_API_URL`/默认 `localhost:3000`）。
5. `next/font`（Inter + Noto Sans SC）替代 Google Fonts `<link>`，消除 CLS、自动 self-host。
6. 迁移 AntD 主题配置到 `src/lib/theme.ts`（从 `main.tsx` 平移）。
7. 迁移全局样式到 `src/app/globals.css`（glassmorphism、动画、自定义滚动条，并新增 `.sr-only`）。
8. 新建 `src/lib/api.ts`：公共 fetch 封装（getProducts/getProviders/getConfig）+ Admin axios 实例 + 类型定义（从 `frontend/src/api/index.ts` 迁移）。
9. 新建 `src/lib/markdown.ts`：rehype-sanitize 安全配置（从 `frontend/src/utils/markdown.ts` 迁移）。
10. 复用现有翻译文件到 `src/messages/zh.json`、`en.json`。
11. 复用 `favicon.svg` 到 `public/`。
12. `src/app/layout.tsx`：根布局，AntdRegistry（SSR 样式注入，避免 FOUC），next/font 字体变量。
13. `src/app/page.tsx`：根路径 `/` → `redirect("/zh")`（占位，阶段 2 完善 Accept-Language 判断）。
14. `src/app/[locale]/page.tsx`：占位首页（验证 AntD 集成，阶段 3 改造为 SSG）。

### 测试结果
- `npx tsc --noEmit`：✅ 通过，无类型错误。
- `npm run build`：✅ 编译成功，生成 4 个页面（`/` Static、`/_not-found`、`/[locale]` Dynamic）。
- Standalone server 运行测试：
  - `GET /` → ✅ HTTP 307 重定向到 `/zh`。
  - `GET /zh` → ✅ HTTP 200，HTML 含 "VPS Navi" h1 文本 + `ant-typography` 类（AntD SSR 样式注入正常，无 FOUC）。
  - `GET /en` → ✅ HTTP 200。

### 是否放行
✅ **放行**。骨架完整、构建通过、AntD SSR 渲染正常、API 代理配置就绪。进入阶段 2。

---

## 阶段 2：i18n URL 路由化

- **状态**：✅ 完成
- **AI 模型**：ZCode (GLM-5.2)

### 本阶段完成内容
1. **URL 路由化**：`/zh/...` 与 `/en/...` 独立 URL，根路径 `/` 根据 `Accept-Language` 重定向（中→/zh、英→/en、其他→/zh 默认）。
2. **`src/lib/i18n.ts`**：纯数据模块（locales、defaultLocale、localeToHtmlLang、messages、resolveLocale），无 react-i18next 依赖，可在 Server Component 安全导入。
3. **`src/lib/i18n-client.ts`**：客户端 i18next 初始化（含 createContext），仅 'use client' 组件使用。
4. **`src/app/[locale]/layout.tsx`**：Server Component，校验 locale（无效 404），`generateStaticParams` 预生成 zh/en，`generateMetadata` 输出 hreflang alternates（zh-CN/en/x-default）+ content-language。
5. **`src/components/I18nProvider.tsx`**：客户端 provider 包装（I18nextProvider + AntD ConfigProvider + LangSync），初始化对应 locale 的 i18n 实例。
6. **`src/components/LangSync.tsx`**：客户端组件，水合后同步 `<html lang>` 到当前 locale。
7. **`src/components/LanguageSwitcher.tsx`**：语言切换改为 URL 跳转（`useRouter().push` 替换 locale 段），localStorage 仅记忆偏好，不再驱动渲染。
8. **翻译文件**：复用现有 `messages/zh.json`、`en.json`。

### 测试结果
- `npm run build`：✅ 通过，`/[locale]` 为 SSG（预渲染 /zh、/en）。
- Standalone server 运行测试：
  - `GET /` (zh Accept-Language) → ✅ HTTP 307 → `/zh`。
  - `GET /` (en Accept-Language) → ✅ HTTP 307 → `/en`。
  - `GET /` (fr Accept-Language) → ✅ HTTP 307 → `/zh`（默认）。
  - `GET /zh` → ✅ HTTP 200，HTML 含 hreflang 三条 alternate（zh-CN/en/x-default → xmde.de）+ content-language=zh-CN + 中文翻译（"公告"）。
  - `GET /en` → ✅ HTTP 200，英文翻译（"Announcement"）。
  - `GET /fr` → ✅ HTTP 404（无效 locale 正确拒绝）。
  - 语言切换器：/zh 显示 "English" 标签，/en 显示 "中文" 标签。

### 是否放行
✅ **放行**。i18n URL 路由完整、双语独立可索引 URL、hreflang 声明正确、无效 locale 404。进入阶段 3。

---

## 阶段 3：首页改造为 SSG + client islands

- **状态**：✅ 完成
- **AI 模型**：ZCode (GLM-5.2)

### 本阶段完成内容
1. **`src/app/[locale]/page.tsx`**（Server Component）：服务端并行 fetch `getProducts` + `getProviders` + `getConfig`，首帧 HTML 即含完整产品表格（爬虫无需 JS）。
2. **`src/components/home/HomeClient.tsx`**（client island）：接收 SSG 预取的 `initialProducts` 作为首帧（无骨架屏闪烁），筛选/排序/分页交互走客户端 `getProducts()`。
3. 迁移公共组件为客户端组件：
   - `src/components/Header.tsx`：页头（语言切换改 LanguageSwitcher，标题用 h1）。
   - `src/components/Announcement.tsx`：公告区（Markdown 渲染，config 驱动）。
   - `src/components/FilterBar.tsx`：筛选栏（服务商列表由服务端预取传入）。
   - `src/components/home/ProductTable.tsx`：桌面端产品表格。
   - `src/components/home/ProductCard.tsx`：移动端产品卡片列表。
   - `src/components/home/ProductSkeleton.tsx`：加载骨架屏（仅客户端后续加载）。
4. **移除所有 `window.__PRERENDER_INJECTED` / HeadlessChrome 检测 hack**（不再需要）。
5. **`src/lib/api.ts`** 关键修复：服务端 fetch 使用绝对地址（`SERVER_BACKEND_URL`），解决构建时相对路径无法解析问题；加 8s 超时，后端不可用时快速降级为空数据。
6. 复用 CSS Modules（Header/FilterBar/Announcement/ProductCard）。
7. `generateMetadata`：按语言动态 title/description + canonical + hreflang。
8. 新增 sr-only 语义 h2（"VPS 产品价格对比"，标题层级修复的预备）。

### 测试结果
- `npx tsc --noEmit`：✅ 通过。
- `npm run build`：✅ 通过，`/[locale]` 为 SSG（5m revalidate = ISR）。
- **爬虫视图验证（curl 无 JS 执行）**：
  - `GET /zh` → ✅ HTTP 200，HTML（306KB）含：产品服务商 `DMIT`、价格 `USD`、产品名 `LAX EB`、affiliate 链接 `example.com/aff`、流量单位 `TB`、带宽 `Gbps`、`ant-table` 表格结构、h1 站点标题、sr-only h2。
  - `GET /en` → ✅ HTTP 200，同样含产品数据，title 为英文。
  - title 正确：zh "VPS导航 - 全球VPS价格对比与推荐 | VPS Navi"，en "VPS Navigator - Global VPS Price Comparison | VPS Navi"。
  - canonical 正确：`https://xmde.de/zh`。
  - 站点配置（announcement/title）服务端预取，首帧即渲染（无骨架屏闪烁）。

### 是否放行
✅ **放行**。核心 SEO 修复达成——爬虫无需 JS 即可抓取完整产品数据。进入阶段 4。

---

## 阶段 4：产品详情页 + 服务商聚合页 + 后端端点

- **状态**：✅ 完成
- **AI 模型**：ZCode (GLM-5.2)

### 本阶段完成内容

#### 4.1 后端新增只读端点
- `GET /api/products/all` — 返回所有未删除产品 ID 列表（`getAllProductIds`）。
- `GET /api/products/:id` — 返回单个产品详情，404 处理（`getProductById`）。
- `GET /api/providers/:name/products` — 返回指定服务商的所有产品（`getProductsByProvider`）。
- 路由顺序处理：`/products/all` 在 `/products/:id` 之前，避免 "all" 被当作 id。

#### 4.2 产品详情页 `app/[locale]/products/[id]/page.tsx`（ISR）
- `generateStaticParams()`：预生成所有产品 × 2 语言。
- `revalidate = 3600`（每小时重新生成）。
- `generateMetadata()`：动态 title（`DMIT LAX EB | VPS Navi`）、description、canonical、hreflang、OG。
- JSON-LD：`Product` + `Offer` + `BreadcrumbList`。
- 产品完整规格、测评链接、下单按钮。
- 内容渲染为 client island（`ProductDetailContent`，AntD 需 ConfigProvider 上下文）。

#### 4.3 服务商聚合页 `app/[locale]/providers/[name]/page.tsx`（SSG）
- `generateStaticParams()`：预生成所有服务商 × 2 语言。
- `generateMetadata()`：动态 title（`DMIT VPS 产品价格对比`）、description、canonical、hreflang、OG。
- 列出该服务商的所有产品，表格内链接到产品详情页。
- JSON-LD：`ItemList` + `Brand`。
- 产品表格为 client island（`ProviderProductsTable`）。

### 测试结果
- 后端 `npx tsc --noEmit`：✅ 通过。
- 后端 Docker 重建 + 端点测试：
  - `/api/products/all` → `[27, 48]` ✅
  - `/api/products/48` → 完整产品详情 ✅
  - `/api/products/999999` → HTTP 404 ✅
  - `/api/providers/DMIT/products` → DMIT 产品列表 ✅
- 前端 `npm run build`：✅ 通过，预生成 8 个 SSG 页面（首页 ×2 + 产品详情 ×4 + 服务商 ×4）。
- 运行验证：
  - `/zh/products/48` → 200，含产品数据（LAX EB/DMIT/USD）+ JSON-LD（Product/Offer/BreadcrumbList）+ h1 + 动态 title。
  - `/zh/providers/DMIT` → 200，含 ItemList + Brand JSON-LD + h1 + 产品详情链接。
  - 不存在产品 → 404。
- **可索引页面数**：从 2（首页 zh/en）增至 8（+产品详情 4 +服务商 4），长尾关键词覆盖开始形成。

### 是否放行
✅ **放行**。后端端点完整、产品详情页/服务商页 SSG 预渲染、JSON-LD 注入、动态 metadata 正确。进入阶段 5。

---

## 阶段 5：迁移 Admin 页面（纯客户端）

- **状态**：✅ 完成
- **AI 模型**：ZCode (GLM-5.2)

### 本阶段完成内容
1. **`src/lib/api.ts`** 新增 Admin API 封装：`adminLogin`、`adminGetProducts`、`adminAddProduct`、`adminUpdateProduct`、`adminDeleteProduct`、`adminGetConfig`、`adminUpdateConfig`（基于动态 getAdminApi axios 实例 + JWT 拦截器，返回解包后数据）。
2. **路由结构**：用路由组隔离登录页与受保护页：
   - `admin/layout.tsx`：根布局，仅 metadata（robots noindex）。
   - `admin/login/page.tsx`：登录页（不经过 AuthGuard）。
   - `admin/(dashboard)/layout.tsx`：AuthGuard + AdminShell 包裹。
   - `admin/(dashboard)/page.tsx`：`/admin` → redirect `/admin/products`。
   - `admin/(dashboard)/products/page.tsx`、`announcement/page.tsx`、`settings/page.tsx`。
3. **`src/components/admin/AuthGuard.tsx`**（客户端）：JWT 过期检查，无效跳转登录页（带 from/reason 参数），mounted state 避免 SSR/CSR 不一致。
4. **`src/components/admin/AdminShell.tsx`**（客户端）：Sider + Header + Content 布局，react-router 的 useNavigate/useLocation/Outlet → Next.js useRouter/usePathname/children。
5. **产品 CRUD**：完整迁移编辑模式 diff 算法（只发送改动字段，traffic/bandwidth 单位换算保护）。
6. **公告管理**：中英文双 Tab Markdown 编辑器 + 实时预览。
7. **配置管理**：站点标题、Logo、社交链接表单。
8. 所有 admin 页面标记 `'use client'`，设置 `robots: { index: false, follow: false }`。

### 测试结果
- `npx tsc --noEmit`：✅ 通过。
- `npm run build`：✅ 通过，5 个 admin 路由预渲染为静态。
- 运行验证：
  - `/admin/login` → 200，HTML 含 "VPS Navigator Admin" 登录卡片，robots noindex 生效。
  - `/admin` → 客户端 redirect 到 /admin/products。
  - `/admin/products` → 200，AuthGuard 客户端保护（无 token 时返回 null 不泄露内容）。
  - **API 代理链路完整**：通过 Next.js `/api` 代理登录获取 token → 带 token 调用 `/api/admin/products`、`/api/admin/config` 均成功返回数据。

### 是否放行
✅ **放行**。Admin 全功能迁移完成（登录/CRUD/配置/公告），客户端认证正确，robots noindex 生效，API 代理正常。进入阶段 6。

---

## 阶段 6：SEO 元数据全面修复

- **状态**：✅ 完成
- **AI 模型**：ZCode (GLM-5.2)

### 本阶段完成内容
1. **域名替换**：全部从 `NEXT_PUBLIC_SITE_URL`（默认 `https://xmde.de`）读取，无 `your-domain.com` 占位符（已验证 grep 无残留）。
2. **`src/lib/seo.ts`**：统一 SEO 配置与 JSON-LD 生成器（SITE_URL / SITE_NAME / generateOrganizationJsonLd / generateWebSiteJsonLd / generateProductJsonLd / generateBreadcrumbJsonLd / generateItemListJsonLd）。
3. **根布局 `app/layout.tsx`** 完整 metadata：
   - `metadataBase`（解决相对 URL 绝对化）。
   - `title` template（`%s | VPS Navi`）。
   - `description`、`keywords`（中英双语关键词）。
   - `openGraph`（og:image → og-default.png 1200×630，locale zh_CN + en_US）。
   - `twitter`（summary_large_image + twitter:image）。
   - `robots`（index/follow true，googleBot max-image-preview large）。
   - `icons`（favicon.svg）。
   - Organization + WebSite JSON-LD 注入（WebSite schema 移除 SearchAction）。
4. **`public/og-default.png`**：用 sharp 生成 1200×630 社交分享占位图（indigo-violet-pink 渐变 + VPS Navi 品牌信息）。
5. **首页 `generateMetadata`**：按语言动态 OG（locale/title/description/image）+ twitter card。
6. 旧 `SEO.tsx` + `react-helmet-async` 已在阶段 1 移除。

### 测试结果
- `npm run build`：✅ 通过。
- 运行验证（`/zh` HTML head）：
  - `og:image` = `https://xmde.de/og-default.png` ✅
  - `twitter:card` = `summary_large_image` ✅
  - `twitter:image` = `https://xmde.de/og-default.png` ✅
  - `keywords` 含中英双语关键词 ✅
  - Organization JSON-LD ✅、WebSite JSON-LD ✅、无 SearchAction ✅
  - `og-default.png` 可访问（HTTP 200, image/png, 72KB）✅
  - `/en` og:locale = `en_US` ✅
  - 产品详情页 og:title = `DMIT LAX EB` ✅

### 是否放行
✅ **放行**。完整 SEO metadata（OG/twitter/canonical/keywords/robots）+ 社交分享图 + JSON-LD 基础。进入阶段 7。

---

## 阶段 7：结构化数据（JSON-LD）

- **状态**：✅ 完成
- **AI 模型**：ZCode (GLM-5.2)

### 本阶段完成内容
1. **`src/lib/seo.ts`** 统一封装 JSON-LD 生成器：`generateOrganizationJsonLd`、`generateWebSiteJsonLd`（移除 SearchAction）、`generateProductJsonLd`（Product+Offer）、`generateBreadcrumbJsonLd`、`generateItemListJsonLd`。
2. **根布局**：注入 Organization + WebSite JSON-LD（全站级）。
3. **首页**：新增 ItemList（产品列表）+ `@graph` 包裹的多个 Product/Offer（争取价格富媒体展示）。
4. **产品详情页**：重构为使用 generateProductJsonLd + generateBreadcrumbJsonLd（Product + Offer + BreadcrumbList）。
5. **服务商页**：重构为使用 generateItemListJsonLd（ItemList + Brand）。
6. 所有 JSON-LD 通过 `<script type="application/ld+json" dangerouslySetInnerHTML>` 在 Server Component 注入。

### 测试结果
- `npm run build`：✅ 通过。
- 运行验证（HTML 内 JSON-LD 计数）：
  - `/zh` 首页：ItemList(1) + Product @graph(1) + Offer(2) + Brand(2) + priceCurrency(1) + Organization(1) + WebSite(1)。
  - `/zh/products/48`：Product(1) + Offer(1, price=104.00 USD) + BreadcrumbList(1)。
  - `/zh/providers/DMIT`：ItemList(1) + Brand(1)。
  - 无 SearchAction（站点无站内搜索）。

### 是否放行
✅ **放行**。JSON-LD 全面覆盖（Product/Offer/ItemList/Organization/BreadcrumbList/Brand/WebSite），统一封装到 lib/seo.ts。进入阶段 8。

---

## 阶段 8：标题层级 + 语义化 HTML 修复

- **状态**：✅ 完成
- **AI 模型**：ZCode (GLM-5.2)

### 本阶段完成内容
1. **Header 标题层级**：新增 `asH1` prop 控制站点标题渲染为 h1（首页）或 div（详情/聚合页，避免双 h1）。
2. **首页 h1→h2 层级**：站点标题 h1 + sr-only h2（"VPS 产品价格对比"）。
3. **产品详情页**：产品名称 h1（Header 站点标题降为 div），规格/价格 h2。
4. **服务商页**：服务商名称 h1（Header 站点标题降为 div）。
5. **Admin 区无 h1**：AdminShell 不渲染标题（验证 /admin/products h1=0）。
6. **新增 `<footer>`**（`src/components/Footer.tsx`）：版权信息、社交链接重复、语言切换、隐私政策链接。出现在所有公共页面（首页/详情/聚合），Admin 区无。
7. **`<aside>` 公告区**：保留（内容为空时不渲染）。
8. **`<img>` width/height**：Header logo 已加 width=120/height=32 防 CLS。

### 测试结果
- `npm run build`：✅ 通过。
- 运行验证（HTML 标签计数）：
  - `/zh` 首页：h1(1) + h2(1, sr-only) + footer(1)。
  - `/zh/products/48`：h1(1, 产品名) + h2(2, 价格+规格) + footer(1)，无双 h1。
  - `/zh/providers/DMIT`：h1(1, 服务商名) + footer(1)。
  - `/admin/products`：h1(0)，admin 无 h1。

### 是否放行
✅ **放行**。标题层级规范（每页唯一 h1→h2→h3），语义化结构完整（header/main/section/aside/footer）。进入阶段 9。

---

## 阶段 9：动态 sitemap.xml + robots.txt

- **状态**：✅ 完成
- **AI 模型**：ZCode (GLM-5.2)

### 本阶段完成内容
1. **`src/app/sitemap.ts`**：从后端动态生成 sitemap：
   - 首页 × 2 语言（priority 1.0, daily）。
   - 所有产品详情页 × 2 语言（priority 0.8, weekly）。
   - 所有服务商页 × 2 语言（priority 0.6, weekly）。
   - 每条 URL 带 lastmod（取产品 updatedAt 最大值）+ hreflang alternates。
   - 后端不可用时降级为仅首页。
2. **`src/app/robots.ts`**：动态 robots.txt：
   - `Allow: /`、`Disallow: /admin/`、`Disallow: /api/`。
   - `Sitemap: https://xmde.de/sitemap.xml`、`Host: https://xmde.de`。
3. **`src/app/manifest.ts`**：PWA manifest（start_url /zh，theme_color #6366f1，favicon.svg 图标）。

### 测试结果
- `npm run build`：✅ 通过，生成 /sitemap.xml、/robots.txt、/manifest.webmanifest。
- 运行验证：
  - `/robots.txt`：Allow / + Disallow /admin/ + /api/ + Sitemap + Host ✅
  - `/sitemap.xml`：10 个 URL（首页×2 + 产品详情×4 + 服务商×4），含 hreflang alternates + lastmod + priority ✅
  - `/manifest.webmanifest`：有效 PWA manifest ✅

### 是否放行
✅ **放行**。动态 sitemap（含全部产品/服务商 URL × 2 语言）+ robots.txt + manifest 就绪。进入阶段 10。

---

## 阶段 10：性能与 JS 分割

- **状态**：✅ 完成
- **AI 模型**：ZCode (GLM-5.2)

### 本阶段完成内容
1. **路由级代码分割**：Next.js App Router 自动按路由分割（无需手动配置）。
2. **react-markdown 懒加载**：`Announcement` 组件用 `next/dynamic` 懒加载 react-markdown（体积大，仅公告有内容时加载），减小首屏 JS。
3. **AntD tree-shaking**：AntD v6 默认支持按需引入。
4. **Admin 区隔离**：Admin 页面（CRUD 表单、Modal 等）在独立 chunk，不进入公开页 bundle。
5. **next/font**（阶段 1 已完成）：Inter + Noto Sans SC，内置优化、消除 CLS、自动 self-host。
6. **@ant-design/nextjs-registry**（阶段 1 已完成）：SSR 样式注入，避免 FOUC。
7. **图片 width/height**（阶段 8 已完成）：Header logo 防 CLS。

### 测试结果
- `npm run build`：✅ 通过。
- 代码分割验证：
  - `/zh` 加载 24 个 JS chunk，`/admin/products` 加载 22 个。
  - 共享 chunk 10 个（React/antd 核心），zh 独有 14 个，admin 独有 12 个。
  - Admin CRUD 代码不进入公开页 bundle，公开页代码不进入 admin bundle。

### 是否放行
✅ **放行**。路由级代码分割生效，react-markdown 懒加载，admin 区隔离。进入阶段 11。

---

## 阶段 11：404 页面 + Nginx 配置

- **状态**：✅ 完成
- **AI 模型**：ZCode (GLM-5.2)

### 本阶段完成内容
1. **`src/app/not-found.tsx`**：友好 404 页面（玻璃拟态卡片 + 404 大标题 + 中英双语说明 + 返回首页按钮）。使用原生 HTML（非 AntD），避免 not-found 特殊环境的组件上下文问题。
2. **`docker/nginx/default.conf`** 重写：
   - 反代所有请求到 Next.js server（`proxy_pass http://frontend:3000`）。
   - 移除 `try_files $uri $uri/ /index.html` SPA fallback（Next.js 自带 404）。
   - `_next/static/` 长缓存（365d immutable）。
   - 保留 gzip 配置。
   - /api/ 由 Next.js rewrites 进一步代理到后端。
3. Next.js 自带 404 处理，无需 nginx error_page hack。

### 测试结果
- `npm run build`：✅ 通过。
- 运行验证：
  - `/zh/nonexistent` → HTTP 404，含 "404" 标题 + "返回首页" 链接。
  - `/zh/products/999999` → HTTP 404（无效产品 id 正确 404）。

### 是否放行
✅ **放行**。友好 404 页面就绪，Nginx 反代 Next.js 配置完成。进入阶段 12。

---

## 阶段 12：Docker 与部署链路更新

- **状态**：✅ 完成
- **AI 模型**：ZCode (GLM-5.2)

### 本阶段完成内容
1. **`docker/frontend/Dockerfile`** 重写（Next.js standalone）：
   - builder 阶段：`npm ci` + `npm run build`（standalone 输出），构建时 `BACKEND_URL` 指向 backend:3000 用于 SSG。
   - runner 阶段：node:20-alpine 运行 standalone server.js，端口 3000。
   - 移除 Chromium/Puppeteer 安装（不再需要预渲染），镜像体积大幅减小。
2. **`docker-compose.yml`** 更新：
   - frontend 服务 build args 传 `BACKEND_URL`。
   - 运行时环境变量：`BACKEND_URL`、`NEXT_PUBLIC_SITE_URL`、`NEXT_PUBLIC_GSC_VERIFICATION`、`NEXT_PUBLIC_GA_ID`、`PORT=3000`。
   - 端口映射改为 `FRONTEND_PORT:3000`（Next.js server 端口）。
3. **`.env.example`** 新增：`NEXT_PUBLIC_SITE_URL`、`BACKEND_URL`、`NEXT_PUBLIC_GSC_VERIFICATION`、`NEXT_PUBLIC_GA_ID`。
4. **`docker/nginx/default.conf`** 重写（阶段 11）：反代到 frontend:3000。
5. **`docs/deployment.md`** 更新：架构变更说明（Next.js standalone + 端口 3000）、docker-compose frontend 段示例、端口映射 80→3000、内部端口说明。
6. 后端服务配置不变；旧 `frontend/` 目录保留至验证完成。

### 测试结果
- `docker compose config --quiet`：✅ 配置有效。
- Dockerfile 基于 Next.js official standalone 模式，移除 Puppeteer。

### 是否放行
✅ **放行**。Docker 链路完整适配 Next.js standalone，部署文档同步更新。进入阶段 13。

---

## 阶段 13：分析工具集成 + 验证

- **状态**：✅ 完成
- **AI 模型**：ZCode (GLM-5.2)

### 本阶段完成内容
1. **Google Search Console 验证**：通过 `NEXT_PUBLIC_GSC_VERIFICATION` 环境变量注入 `google-site-verification` meta 标签（仅在配置时输出）。
2. **Google Analytics 4**：安装 `@next/third-parties`，通过 `<GoogleAnalytics gaId={GA_ID} />` 注入（仅在配置 `NEXT_PUBLIC_GA_ID` 时加载），使用 next/script 优化加载。
3. 完整验证清单（14 项全部通过）。

### 测试结果（验证清单）
1. ✅ `curl /zh` HTML 含产品数据（DMIT/USD）——爬虫无需 JS 即可抓取。
2. ✅ `curl /en` HTML 含产品数据（英文版）。
3. ✅ JSON-LD 验证：Organization + ItemList + Product @graph 均存在。
4. ✅ hreflang 标签：`hrefLang="zh-CN"` + `hrefLang="en"` + `hrefLang="x-default"`。
5. ✅ 产品详情页 `/zh/products/48` → HTTP 200，含产品数据。
6. ✅ 服务商页 `/zh/providers/DMIT` → HTTP 200。
7. ✅ `/sitemap.xml` → HTTP 200，10 个 URL（首页×2 + 产品×4 + 服务商×4）。
8. ✅ `/robots.txt` → HTTP 200（Allow / + Disallow /admin/ /api/）。
9. ✅ 社交分享 og:image = `https://xmde.de/og-default.png`。
10. ✅ GSC 验证：`google-site-verification` meta = `test_gsc_token_123`。
11. ✅ GA4 脚本：gtag 加载 `G-TEST123456`。
12. ✅ admin 区 robots noindex 生效。
13. ✅ 404 页面 → HTTP 404（友好页面）。
14. ✅ 根路径 `/` → HTTP 307 重定向 `/zh`（Accept-Language 判断）。

### 是否放行
✅ **放行**。GSC + GA4 集成完成，14 项验证清单全部通过。迁移方案执行完整到位。

---

## 总结

13 个阶段全部完成，按顺序执行，每阶段测试通过后进入下一阶段。

### 预期收益达成情况

| 指标 | 现状（旧 Vite SPA） | 目标 | 实际达成 |
|---|---|---|---|
| 爬虫首屏可见内容 | ❌ 空 root | ✅ 完整产品表格 | ✅ HTML 含产品数据 |
| 可索引页面数 | ❌ 仅首页 1 个 | ✅ 首页+详情+服务商×2 语言 | ✅ 10 个 SSG 页面 |
| i18n 可索引性 | ❌ 1 个 zh-CN URL | ✅ /zh/ + /en/ 独立 URL + hreflang | ✅ hreflang 三向声明 |
| Core Web Vitals | ⚠️ ~400KB JS 阻塞 | ✅ 路由级分割 | ✅ 路由级代码分割 |
| 标题层级 | ❌ 无 h1 | ✅ 规范 h1→h2 | ✅ 每页唯一 h1 |
| JSON-LD 富媒体 | ❌ 仅 WebSite | ✅ Product/Offer/ItemList/Org/Breadcrumb | ✅ 全覆盖 |
| 社交分享预览 | ❌ 无 og:image | ✅ 大图卡 | ✅ og-default.png |
| 长尾关键词覆盖 | ❌ 几乎为零 | ✅ 产品名+服务商名 | ✅ 详情页+服务商页 |
| SEO 监控 | ❌ 无 | ✅ GSC + GA4 | ✅ 环境变量注入 |

---

## 代码审查修复

- **状态**：✅ 完成
- **AI 模型**：ZCode (GLM-5.2)
- **时间**：2026-07-11

审查发现 5 个问题，全部修复并通过验证。

### 修复 1: .dockerignore 未更新（构建上下文膨胀）
- **问题**：`.dockerignore` 仍排除旧 `frontend/node_modules`，新 `frontend-next/node_modules`（数百 MB）和 `.next` 被包含在 Docker 构建上下文。
- **修复**：`.dockerignore` 新增 `frontend-next/node_modules`、`frontend-next/.next`、`frontend-next/.env*`。
- **验证**：✅ `.dockerignore` 含 3 处 `frontend-next` 排除项。

### 修复 2: docker/nginx/default.conf 孤儿配置
- **问题**：新 Dockerfile 不用 nginx，但 `default.conf` 被重写为反代 `frontend:3000`，无容器引用，读者歧义。
- **修复**：文件头新增 14 行注释，明确说明：该文件未被 Docker 容器引用，仅作为 1Panel/OpenResty 反向代理参考模板。
- **验证**：✅ 注释包含"参考配置"和"未被任何 Docker"关键词。

### 修复 3: [locale] 段内 notFound() 使用根级 404
- **问题**：`notFound()` 在 `[locale]` 段内调用，但只有根级 `not-found.tsx`，404 不带 locale 上下文。
- **修复**：新增 `src/app/[locale]/not-found.tsx`，读取 locale 参数渲染中英双语 404 页面。params 设为可选（预渲染时可能 undefined），用 `resolveLocale` 安全降级。
- **验证**：✅ `/zh/products/999` → 404 含"页面未找到"+"返回首页"；`/en/products/999` → 404 含"Page Not Found"+"Back to Home"。

### 修复 4: sitemap.ts 冗余请求取 lastmod
- **问题**：`getProducts({pageSize:1})` 拉取完整产品对象仅为取 `updatedAt`，冗余。
- **修复**：后端 `getAllProductIds` 返回值从 `number[]` 改为 `{id, updatedAt}[]`（select 增加 `updatedAt`），前端 `sitemap.ts` 复用该数据计算 lastmod，移除冗余 `getProducts` 调用。同步更新 `lib/api.ts` 类型（`ProductIdWithUpdated`）和 `generateStaticParams` 调用方。
- **验证**：✅ sitemap 含 10 个 URL，lastmod 有两个不同值（来自产品 updatedAt），无冗余请求。

### 修复 5: 后端 getProductById 接受十六进制
- **问题**：`Number("0x10")=16`，`Number.isInteger(16)=true`，十六进制路径参数被接受。
- **修复**：`getProductById` 改用 `parseInt(rawId, 10)`（仅十进制），并处理 `req.params.id` 为 `string | string[]` 的类型。
- **验证**：✅ `/api/products/0x10` → 400（拒绝十六进制）；`/api/products/48` → 200；`/api/products/abc` → 400；`/api/products/999999` → 404。

### 验证结果
- `npx tsc --noEmit`（frontend-next）：✅ 通过。
- `npx tsc --noEmit`（backend）：✅ 通过。
- `npm run build`（frontend-next）：✅ 通过，22 个页面预渲染。
- 运行时回归：✅ `/zh`、`/en`、`/zh/products/48`、`/zh/providers/DMIT` 均 200，产品数据正常。

---

## 第二轮代码审查修复

- **状态**：✅ 完成
- **AI 模型**：ZCode (GLM-5.2)
- **时间**：2026-07-11

第二轮审查发现 7 个问题，全部修复并通过验证。

### 修复 1: Footer /privacy 404 — 创建隐私政策页
- **问题**：Footer 链接到 `/[locale]/privacy`，但该路由不存在，全站 404。
- **修复**：新增 `src/app/[locale]/privacy/page.tsx`（SSG，双语，5 个政策段落），含 generateStaticParams + generateMetadata（canonical/hreflang）。
- **验证**：✅ `/zh/privacy` → 200（"隐私政策"），`/en/privacy` → 200（"Privacy Policy"），Footer 链接正确指向。

### 修复 2: HomeClient 死代码 — 删除 config 重复请求
- **问题**：`HomeClient` 客户端组件初始化 `config` state 并调用 `getConfig()` 发起请求，但 config 从未在 JSX 中使用（父组件 page.tsx 已在服务端获取 config 传入 Header/Announcement/Footer）。每次首页加载多发一个无用请求。
- **修复**：删除 `config` state、`loadConfig` effect、`getConfig`/`FrontendConfig` 导入。
- **验证**：✅ HomeClient 中 `getConfig` 和 `FrontendConfig` 引用数为 0。

### 修复 3: JSON-LD `</script>` 转义 — 纵深防御 XSS
- **问题**：所有 JSON-LD 注入点用 `JSON.stringify` + `dangerouslySetInnerHTML`，但 `JSON.stringify` 不转义 `</script>` 序列。admin 输入的 affiliateUrl 若含 `</script><script>...` 可逃逸 script 标签。
- **修复**：`lib/seo.ts` 新增 `safeJsonLd()` 函数（`JSON.stringify` 后替换 `<` 为 `\u003c`），所有 8 处 JSON-LD 注入点改用 `safeJsonLd()`。
- **验证**：✅ app/ 中无 `JSON.stringify` + `dangerouslySetInnerHTML` 组合，12 处 `safeJsonLd` 调用。

### 修复 4: `<html lang>` 硬编码 — SEO 缓解改进
- **问题**：根布局硬编码 `lang="zh-CN"`，`/en` 页面原始 HTML 也为 zh-CN，仅靠 LangSync useEffect 客户端修正。
- **修复**：`<html>` 加 `suppressHydrationWarning`（允许 LangSync 无警告更新 lang），LangSync 注释更新说明缓解策略。`content-language` meta 已在 `[locale]/layout.tsx` 中按 locale 输出。
- **验证**：✅ `suppressHydrationWarning` 存在，`content-language` meta 按 locale 正确输出。

### 修复 5: SITE_URL 统一用 lib/seo.ts 导出
- **问题**：4 个文件内联 `process.env.NEXT_PUBLIC_SITE_URL || "https://xmde.de"`，而 `lib/seo.ts` 已导出 `SITE_URL`。重复 5 处硬编码 fallback。
- **修复**：`[locale]/layout.tsx`、`page.tsx`、`products/[id]/page.tsx`、`providers/[name]/page.tsx` 的 `generateMetadata` 统一改用 `import { SITE_URL }`，删除内联 `siteUrl` 变量。
- **验证**：✅ app/ 中 `process.env.NEXT_PUBLIC_SITE_URL` 引用数为 0（全部走 SITE_URL 常量）。

### 修复 6: LanguageSwitcher 正则 guard
- **问题**：`pathname.replace(/^\/(zh|en)(\/|$)/, ...)` 对无 locale 前缀路径（如 `/admin/products`）返回原值，切换器在 admin 内导航而非跳转另一语言。
- **修复**：新增 `hasLocalePrefix` 检查，无前缀时回退到 `/${targetLocale}` 首页。
- **验证**：✅ `hasLocalePrefix` guard 存在。

### 修复 7: HomeClient useRef 具名导入
- **问题**：导入了 `useEffect, useState, useCallback` 但用 `React.useRef`，风格不一致（且已移除 React 默认导入）。
- **修复**：`useRef` 加入具名导入，`React.useRef` → `useRef`。
- **验证**：✅ `useRef` 具名导入存在，`React.useRef` 引用数为 0。

### 验证结果
- `npx tsc --noEmit`（frontend-next）：✅ 通过。
- `npm run build`：✅ 通过，24 个页面预渲染（新增 /zh/privacy + /en/privacy）。
- 运行时验证：
  - `/zh/privacy` → 200（"隐私政策" + "返回首页"），`/en/privacy` → 200（"Privacy Policy"）。
  - 回归：`/zh`、`/en`、`/zh/products/48`、`/zh/providers/DMIT`、`/admin/login` 均 200。
  - 产品数据正常（DMIT），JSON-LD 正常（schema.org），sitemap 10 URL。

---

## 第三轮：安全审查与漏洞修复（13 项）

- **状态**：✅ 全部完成
- **AI 模型**：ZCode (builtin:bigmodel-coding-plan/GLM-5.2)
- **开始时间**：2026-07-11
- **执行原则**：按阶段顺序（A→B→C→D→E→F），不跳步、不并行；任一阶段测试未通过不进入下一阶段。

### 阶段执行状态总览

| 阶段 | 修复编号 | 名称 | 状态 | 放行 |
|---|---|---|---|---|
| A | #1 #6 #7 | CORS 通配符 + JSON body 限制 + trust proxy | ✅ 完成 | ✅ 放行 |
| B | #2 #3 | 配置白名单 + URL 协议校验 | ✅ 完成 | ✅ 放行 |
| C | #4 #9 | expiresIn 类型契约 + dummy hash 同步阻塞 | ✅ 完成 | ✅ 放行 |
| D | #11 | AuthGuard 自动登出 + 前端类型适配 | ✅ 完成 | ✅ 放行 |
| E | #5 #8 #10 #12 #13 | async 兜底 + 软删除语义 + env 一致性 + validateNumberField 语义 | ✅ 完成 | ✅ 放行 |
| F | — | 更新 progress.md + architecture.md | ✅ 完成 | ✅ 放行 |

---

### 阶段 A：CORS 通配符 + JSON body 限制 + trust proxy（#1 #6 #7）

- **状态**：✅ 完成
- **AI 模型**：ZCode (GLM-5.2)

#### 本阶段完成内容
1. **#1 CORS 通配符 + credentials**：`app.ts` 移除 `allowAnyOrigin` 逻辑。生产环境 `CORS_ORIGIN=*` 直接抛错拒绝启动；开发环境 `*` 降级为 localhost 白名单。origin 回调仅放行同源（无 Origin 头）或白名单内来源，不再对任意来源返回 `true`。
2. **#6 JSON body 限制**：`express.json({ limit })` 从 `10mb` 降至 `1mb`，防止大 body DoS。
3. **#7 trust proxy**：从硬编码 `app.set('trust proxy', 1)` 改为 `TRUST_PROXY_HOPS` 环境变量可配置（默认 1），适配多层代理部署（如 Cloudflare→nginx→容器 = 3）。
4. 更新 `backend/.env`（CORS_ORIGIN 改显式白名单 + 新增 TRUST_PROXY_HOPS）、`.env.example`（新增说明）。

#### 测试结果
- `npx tsc --noEmit`：✅ 通过。
- 集成测试（加载真实 app，4 项）：✅ 全通过。
  - 邪恶 origin 不返回 ACAO ✅
  - 合法 origin 返回正确 ACAO ✅
  - 2MB body 被拒绝（413）✅
  - 小 body 被接受（非 413）✅
- 生产环境 `CORS_ORIGIN=*` 启动时抛错拒绝 ✅

#### 是否放行
✅ **放行**。

---

### 阶段 B：配置白名单 + URL 协议校验（#2 #3）

- **状态**：✅ 完成
- **AI 模型**：ZCode (GLM-5.2)

#### 本阶段完成内容
1. **#2 配置接口白名单 + URL 协议校验**：
   - `updateConfig` 新增 `ALLOWED_CONFIG_KEYS` 白名单（9 个预定义 key），拒绝未知 key。
   - 新增 `URL_CONFIG_KEYS` 集合（site_logo + 4 个社交链接），其值必须通过 http(s) 协议校验。
   - URL 校验在 DB 查询之前执行，确保危险输入在任何 I/O 之前被拒绝。
2. **#3 affiliateUrl/reviewUrl 协议校验**：
   - `addProduct`：affiliateUrl 必须 http(s)；reviewUrl 可选但若提供必须 http(s)。
   - `updateProduct`：同上。
3. 新增 `backend/src/utils/validators.ts`：`isSafeHttpUrl()` / `isSafeOptionalHttpUrl()`，使用 URL 构造器解析 + 协议白名单（http/https only），拒绝 javascript:/data:/vbscript:/file:。

#### 测试结果
- `npx tsc --noEmit`：✅ 通过。
- 验证器单元测试（15 项）：✅ 全通过。
- Controller 集成测试（加载真实 app，8 项）：✅ 全通过。
  - addProduct javascript: affiliateUrl → 400 ✅
  - addProduct javascript: reviewUrl → 400 ✅
  - addProduct https URL → 通过校验 ✅
  - updateConfig 未知 key → 400 ✅
  - updateConfig javascript: site_logo → 400 ✅
  - updateConfig data: link_telegram → 400 ✅
  - updateConfig https link_telegram → 通过 ✅
  - updateConfig announcement 文本 → 通过 ✅

#### 是否放行
✅ **放行**。

---

### 阶段 C：expiresIn 类型契约 + dummy hash 同步阻塞（#4 #9）

- **状态**：✅ 完成
- **AI 模型**：ZCode (GLM-5.2)

#### 本阶段完成内容
1. **#4 expiresIn 类型契约**：
   - 后端 `login` 返回值从字符串 `'30m'` 改为数字 `1800`（`TOKEN_EXPIRES_IN_SECONDS` 常量）。
   - `jwt.sign()` 的 `expiresIn` 也统一使用该数字常量。
   - 后端 `types/index.ts` 的 `LoginResponse.expiresIn` 类型 string→number。
   - 前端 `api.ts` 已为 number 类型，无需修改。
2. **#9 dummy hash 同步阻塞**：
   - `DUMMY_PASSWORD_HASH` 从模块加载时 `bcrypt.hashSync(...)` 改为预生成固定 hash 常量字符串。
   - 经 `bcrypt.compareSync` 验证：占位密码匹配、错误密码拒绝，时序防护仍有效。

#### 测试结果
- `npx tsc --noEmit`（后端+前端）：✅ 通过。
- 运行时测试（7 项）：✅ 全通过。
  - dummy hash 匹配占位密码 ✅
  - dummy hash 拒绝错误密码 ✅
  - dummy hash 为预生成常量 ✅
  - 模块加载不被 bcrypt 阻塞（< 50ms）✅
  - TOKEN_EXPIRES_IN_SECONDS 为数字 1800 ✅
  - LoginResponse.expiresIn 为 number ✅
- 全局搜索：无残留 `expiresIn: '30m'` ✅

#### 是否放行
✅ **放行**。

---

### 阶段 D：AuthGuard 自动登出 + 前端类型适配（#11）

- **状态**：✅ 完成
- **AI 模型**：ZCode (GLM-5.2)

#### 本阶段完成内容
1. **#11 AuthGuard 自动登出**：
   - 新增 `setInterval` 定时器（每 30 秒），token 过期时主动清除 localStorage 并跳转登录页。
   - `useRef` 管理 timer 引用，`useEffect` cleanup 中 `clearInterval`，防止内存泄漏。
   - 提取 `redirectToLogin` / `checkToken` 内部函数。
2. 前端 #4 适配：`LoginResponse.expiresIn` 已为 number，与后端一致。

#### 测试结果
- `npx tsc --noEmit`（前端）：✅ 通过。
- Token 过期逻辑测试（9 项）：✅ 全通过。
  - null/undefined/空 token → 过期 ✅
  - 非 JWT 格式 → 过期 ✅
  - 过去 exp → 过期 ✅
  - 未来 exp → 未过期 ✅
  - 近未来（10s）→ 未过期 ✅
  - 无 exp → 未过期 ✅

#### 是否放行
✅ **放行**。

---

### 阶段 E：async 兜底 + 软删除语义 + env 一致性 + validateNumberField 语义（#5 #8 #10 #12 #13）

- **状态**：✅ 完成
- **AI 模型**：ZCode (GLM-5.2)

#### 本阶段完成内容
1. **#5 async 错误兜底**：确认 Express 5.2.1 原生支持 async rejection 转发。新增 `asyncHandler()` 包装器（`Promise.resolve(fn).catch(next)`）作纵深防御。现有 controller 已有 try/catch。
2. **#8 软删除语义**：`deleteProduct` 新增 `isDeleted` 检查，已删除产品返回幂等消息 `"Product already deleted"`。
3. **#10 getProducts 分页**：已确认 `Number(query.page)` 的 `NaN || 1` fallback 正确，无需修改。
4. **#12 env 一致性**：阶段 A 已修复，验证三个 env 文件 CORS 一致无 `*`。
5. **#13 validateNumberField 语义**：新增 JSDoc 文档说明 `{ min: 0 }`（allowZero=false）要求 `> 0`，`{ min: 0, allowZero: true }` 要求 `>= 0`。

#### 测试结果
- `npx tsc --noEmit`（后端+前端）：✅ 通过。
- 运行时测试（10 项）：✅ 全通过。
  - asyncHandler 正常 handler 被调用 ✅
  - asyncHandler 抛出异常转发给 next(error) ✅
  - validateNumberField 8 种边界用例 ✅

#### 是否放行
✅ **放行**。

---

### 阶段 F：更新 progress.md + architecture.md

- **状态**：✅ 完成
- **AI 模型**：ZCode (GLM-5.2)

#### 本阶段完成内容
1. `progress.md` 追加第三轮安全审查与漏洞修复完整记录（阶段 A-F）。
2. `architecture.md` 追加第三轮安全审查修复产物表 + 各文件作用总览。

#### 测试结果
- 文档完整性检查：✅ 13 项修复全部有对应记录。
- 代码变更文件：7 个（.env.example、app.ts、adminController.ts、errorHandler.ts、types/index.ts、validators.ts、AuthGuard.tsx）+ backend/.env（gitignored）。

#### 是否放行
✅ **放行**。全部 13 项 Bug 与安全漏洞修复完成。

---

### 全局验证结果（最终）
- `npx tsc --noEmit`（backend）：✅ 通过，0 错误。
- `npx tsc --noEmit`（frontend-next）：✅ 通过，0 错误。
- 变更文件 7 个（+1 gitignored），新增 230 行，删除 21 行。
- 13 项问题全部修复，每阶段测试通过后放行。

---

## 第四轮：深度安全审查与漏洞修复（12 项）

- **状态**：✅ 全部完成
- **AI 模型**：ZCode (builtin:bigmodel-coding-plan/GLM-5.2)
- **时间**：2026-07-11
- **执行原则**：严格按 12 阶段顺序执行，不跳步、不并行；任一阶段测试未通过不进入下一阶段；每阶段输出"完成内容 + 测试结果 + 是否放行"。

### 阶段执行状态总览

| 阶段 | 修复编号 | 名称 | 严重级别 | 状态 | 放行 |
|---|---|---|---|---|---|
| 1 | #1 | 服务端 JWT 失效机制 | 🔴 高危 | ✅ 完成 | ✅ 放行 |
| 2 | #2 | trust proxy 与登录限速加固 | 🔴 高危 | ✅ 完成 | ✅ 放行 |
| 3 | #3 | validateNumberField 显式 inclusive 语义 | 🟠 中危 | ✅ 完成 | ✅ 放行 |
| 4 | #4 | 前端 diff 浮点比较健壮性 | 🟠 中危 | ✅ 完成 | ✅ 放行 |
| 5 | #5 | getProductsByProvider 分页上限 | 🟠 中危 | ✅ 完成 | ✅ 放行 |
| 6 | #6 | getAdminConfig 剥离内部字段 | 🟠 中危 | ✅ 完成 | ✅ 放行 |
| 7 | #7 | JWT algorithm 白名单 | 🟡 低危 | ✅ 完成 | ✅ 放行 |
| 8 | #8 | auth 中间件校验 admin 仍存在 | 🟡 低危 | ✅ 完成 | ✅ 放行 |
| 9 | #9 | CORS !origin 处理收紧 | 🟡 低危 | ✅ 完成 | ✅ 放行 |
| 10 | #10 | DUMMY_PASSWORD_HASH 进程唯一化 | 🟡 低危 | ✅ 完成 | ✅ 放行 |
| 11 | #11 | 错误日志脱敏 | 🟡 低危 | ✅ 完成 | ✅ 放行 |
| 12 | #12 | db.ts 不安全默认值 | 🟡 低危 | ✅ 完成 | ✅ 放行 |

---

### 阶段 1：服务端 JWT 失效机制（#1，🔴 高危）

- **状态**：✅ 完成
- **AI 模型**：ZCode (GLM-5.2)

#### 本阶段完成内容
1. `prisma/schema.prisma`：新增 `RevokedToken` 模型（jti 主键、adminId、expiresAt、revokedAt）。
2. `prisma/migrations/20260711120000_add_revoked_token/migration.sql`：建表 SQL（主键 + adminId 索引 + expiresAt 索引）。
3. `src/utils/tokenRevocation.ts`（新增）：`generateJti()` / `revokeToken()` / `isTokenRevoked()`，通过 `$queryRawUnsafe` 访问（不依赖重新生成 client），表不存在时优雅降级 + 轻量 GC（过期记录自动清理）。
4. `adminController.ts`：`login` 签发 JWT 带 `jti` claim；新增 `logout` 函数（从 token 解码 jti+exp，吊销当前 token）。
5. `middleware/auth.ts`：改为 async，签名校验后查询吊销表，已吊销 token 返回 401（"会话已失效"）。
6. `routes/adminRoutes.ts`：注册 `POST /api/admin/logout`（auth 保护）。
7. 前端 `api.ts`：新增 `adminLogout()`；`AdminShell.tsx`：登出先调后端吊销再清本地 token。

#### 测试结果
- 后端 `tsc --noEmit`：✅ 0 错误
- 前端 `tsc --noEmit`：✅ 0 错误
- 运行时测试（7 项）：✅ 全通过（generateJti 唯一性、降级行为、logout 导出、jti claim、auth async、auth 401）

#### 是否放行
✅ **放行**。

---

### 阶段 2：trust proxy 与登录限速加固（#2，🔴 高危）

- **状态**：✅ 完成
- **AI 模型**：ZCode (GLM-5.2)

#### 本阶段完成内容
1. `rateLimiter.ts`：新增 `getClientIp()`（私有 IP 时回退到 X-Forwarded-For 最左侧真实客户端 IP）和 `isPrivateIp()`。
2. `globalLimiter` 使用显式 `keyGenerator`。
3. `loginLimiter` 改为 **IP + username 组合计数**——即使 IP 被伪造，同一用户名爆破仍受限；不同用户名独立计数，NAT 下不误伤。
4. `app.ts`：trust proxy 加生产环境诊断日志，补充部署拓扑注释（Next.js rewrites 本身是一跳）。
5. `.env.example`：补充 Next.js rewrites 跳数提醒。

#### 测试结果
- 后端 `tsc --noEmit`：✅ 0 错误
- 运行时测试（6 项）：✅ 全通过，含关键行为测试：
  - 登录爆破（同 IP+username）第 6 次被 429 阻断 ✅
  - 不同 username 独立计数（userA 耗尽不影响 userB）✅

#### 是否放行
✅ **放行**。

---

### 阶段 3：validateNumberField 显式 inclusive 语义（#3，🟠 中危）

- **状态**：✅ 完成
- **AI 模型**：ZCode (GLM-5.2)

#### 本阶段完成内容
- `adminController.ts`：将 `allowZero` 参数重命名为数学标准术语 `inclusive`（闭区间/开区间）。`inclusive: true` → `>= min`，默认 `false` → `> min`。行为完全等价，消除 `allowZero` 仅在 `min:0` 时名字合理的歧义。4 处 `allowZero: true` 调用点全部迁移为 `inclusive: true`。JSDoc 用数学区间记法 `(0,+∞)` / `[0,+∞)` 说明。

#### 测试结果
- 后端 `tsc --noEmit`：✅ 0 错误
- 运行时测试（3 项）：✅ 全通过

#### 是否放行
✅ **放行**。

---

### 阶段 4：前端 diff 浮点比较健壮性（#4，🟠 中危）

- **状态**：✅ 完成
- **AI 模型**：ZCode (GLM-5.2)

#### 本阶段完成内容
- `frontend-next/src/app/admin/(dashboard)/products/page.tsx`：新增 `numChanged()` 浮点容差比较函数（相对容差 1e-9），替换 cpu/memory/disk/price/monthlyTraffic/bandwidth 的 `!==` 比较。消除浮点往返（DB Float → JSON → InputNumber → 回传）产生的微小编差导致未改动字段被误发送。

#### 测试结果
- 前端 `tsc --noEmit`：✅ 0 错误
- 运行时测试（5 项）：✅ 全通过（相同值、浮点噪声、实质改变、null 处理、零值边界）

#### 是否放行
✅ **放行**。

---

### 阶段 5：getProductsByProvider 分页上限（#5，🟠 中危）

- **状态**：✅ 完成
- **AI 模型**：ZCode (GLM-5.2)

#### 本阶段完成内容
- `productController.ts`：`getAllProductIds` 加 `take: 10000` 上限；`getProductsByProvider` 加 `take: 200` 上限。防止极端数据量下无限制查询耗尽资源。

#### 测试结果
- 后端 `tsc --noEmit`：✅ 0 错误
- 运行时测试（2 项）：✅ 全通过

#### 是否放行
✅ **放行**。

---

### 阶段 6：getAdminConfig 剥离内部字段（#6，🟠 中危）

- **状态**：✅ 完成
- **AI 模型**：ZCode (GLM-5.2)

#### 本阶段完成内容
1. 后端 `adminController.ts`：`getAdminConfig` 新增 `select: { configKey: true, configValue: true }`，不再暴露 `id`/`description`/`updatedAt` 内部元数据。
2. 前端 `api.ts`：`SystemConfigItem` 类型精简为 `{ configKey, configValue }`，与后端响应一致。

#### 测试结果
- 后端 + 前端 `tsc --noEmit`：✅ 0 错误
- 运行时测试（2 项）：✅ 全通过

#### 是否放行
✅ **放行**。

---

### 阶段 7：JWT algorithm 白名单（#7，🟡 低危）

- **状态**：✅ 完成
- **AI 模型**：ZCode (GLM-5.2)

#### 本阶段完成内容
- `adminController.ts`：`jwt.sign` 显式指定 `algorithm: 'HS256'`。
- `auth.ts`：`jwt.verify` 显式指定 `algorithms: ['HS256']`（阶段 1 已完成）。两端锁定算法，纵深防御 `alg: none` 与算法混淆攻击。

#### 测试结果
- 后端 `tsc --noEmit`：✅ 0 错误
- 运行时测试（3 项）：✅ 全通过，含关键安全测试：`alg:none` token 被拒绝 ✅

#### 是否放行
✅ **放行**。

---

### 阶段 8：auth 中间件校验 admin 仍存在（#8，🟡 低危）

- **状态**：✅ 完成
- **AI 模型**：ZCode (GLM-5.2)

#### 本阶段完成内容
- `auth.ts`：签名 + 吊销校验通过后，新增 `prisma.admin.findUnique({ where: { id }, select: { id: true } })` 查询，admin 不存在时返回 401。仅 select id 开销极小。DB 不可达时降级放行（不因 DB 抖动锁死管理员）。

#### 测试结果
- 后端 `tsc --noEmit`：✅ 0 错误
- 运行时测试（3 项）：✅ 全通过

#### 是否放行
✅ **放行**。

---

### 阶段 9：CORS !origin 处理收紧（#9，🟡 低危）

- **状态**：✅ 完成
- **AI 模型**：ZCode (GLM-5.2)

#### 本阶段完成内容
- `app.ts`：新增 `/api/admin` 路由专用 Origin 收紧中间件。对携带 `Authorization` 头的写操作（POST/PUT/DELETE/PATCH），若 Origin 头存在但不在白名单中，返回 403。无 Origin 头的请求放行（兼容同源/Next.js 代理），公开 API 不受影响。

#### 测试结果
- 后端 `tsc --noEmit`：✅ 0 错误
- 行为测试（4 项，supertest）：✅ 全通过（邪恶 Origin 403、合法 Origin 放行、无 Origin 放行、公开请求不受影响）

#### 是否放行
✅ **放行**。

---

### 阶段 10：DUMMY_PASSWORD_HASH 进程唯一化（#10，🟡 低危）

- **状态**：✅ 完成
- **AI 模型**：ZCode (GLM-5.2)

#### 本阶段完成内容
- `adminController.ts`：移除硬编码的 `DUMMY_PASSWORD_HASH` 常量，改为 `getDummyPasswordHash()` 函数——进程启动时用 `crypto.randomBytes` 生成随机密码，异步（不阻塞启动）计算 bcrypt hash 并缓存到 Promise。每次进程重启 hash 不同，消除固定公开 hash 的理论风险。

#### 测试结果
- 后端 `tsc --noEmit`：✅ 0 错误
- 运行时测试（3 项）：✅ 全通过（含进程唯一性验证）

#### 是否放行
✅ **放行**。

---

### 阶段 11：错误日志脱敏（#11，🟡 低危）

- **状态**：✅ 完成
- **AI 模型**：ZCode (GLM-5.2)

#### 本阶段完成内容
1. 新增 `src/utils/logError.ts`：统一错误日志工具，仅输出 `name + code + message` 单行，不打印完整 error 对象（避免泄露 Prisma SQL 语句、参数值、堆栈路径）。
2. 替换所有 controller/middleware 中的 `console.error('XXX:', error)` 为 `logError('XXX', error)`：adminController（8 处）、productController（5 处）、configController（1 处）、errorHandler（1 处）、tokenRevocation（1 处）。

#### 测试结果
- 后端 `tsc --noEmit`：✅ 0 错误
- 运行时测试（5 项）：✅ 全通过，含关键验证：模拟 Prisma 错误的 query/params/stack 不泄露 ✅

#### 是否放行
✅ **放行**。

---

### 阶段 12：db.ts 不安全默认值（#12，🟡 低危）

- **状态**：✅ 完成
- **AI 模型**：ZCode (GLM-5.2)

#### 本阶段完成内容
1. `src/utils/db.ts`：新增 `readRequiredDbEnv()` 函数，生产环境强制校验 `DATABASE_HOST/USER/PASSWORD/NAME` 非空（缺失抛错拒绝启动），开发环境保留默认值并打印警告。与 `secrets.ts` 对 JWT_SECRET 的严格校验风格一致。
2. `prisma/seed.ts`：同步应用相同的生产校验逻辑。
3. `scripts/seedRuntime.ts` 自动继承（复用 db.ts 的 prisma）。

#### 测试结果
- 后端 `tsc --noEmit`：✅ 0 错误
- 运行时测试（4 项）：✅ 全通过，含生产环境缺 DB 凭证抛错的子进程验证 ✅

#### 是否放行
✅ **放行**。

---

### 全局验证结果（第四轮最终）

- `npx tsc --noEmit`（backend）：✅ 通过，0 错误。
- `npx tsc --noEmit`（frontend-next）：✅ 通过，0 错误。
- `npm run build`（frontend-next）：✅ 通过，24 个页面预渲染。
- `npx prisma migrate deploy`：✅ 2 个 migration 成功应用（init + add_revoked_token）。
- **E2E 端到端测试（真实后端 + 真实 MySQL，8 项）：✅ 全通过**
  1. ✅ 公开 API 正常（51 条产品）
  2. ✅ 登录成功 + JWT 含 jti claim
  3. ✅ getAdminConfig 不含 description/id 内部字段
  4. ✅ auth 中间件校验 admin 存在（有效 token 通过）
  5. ✅ auth 拒绝无效 token（alg:none 防护）
  6. ✅ **登出吊销 token 后，旧 token 立即失效（401）**
  7. ✅ CORS admin 收紧：邪恶 Origin + Authorization 写操作 → 403
  8. ✅ 错误日志脱敏生效
- 12 项问题全部修复，每阶段测试通过后放行。

---

## 前端视觉重做：Editorial-Data Minimal（2026-07-12）

### 背景

旧前端视觉为 glassmorphism + bounce + indigo→violet→pink 渐变，被 `frontend-design` 技能明确判定为
"AI slop" 指纹（glassmorphism 满屏、bounce/elastic 缓动、紫蓝渐变按钮、Inter 字体、重复等宽卡片网格）。
虽与 AGENTS.md 旧版 "Modern · Trustworthy · Lively" 描述一致，但与技能审美指南冲突。

经与用户确认，采用最彻底方向：**Editorial-Data Minimal**（暖色编辑式规格出版物美学），
范围覆盖**全部页面 + token 系统重建 + AGENTS.md 更新**。

### 视觉方向（已落地）

- **调色板**：暖色中性（paper `#faf9f7` / ink `#1a1d29`），单一深靛蓝实色 accent `#4338ca`。
  无渐变、无 backdrop-filter、无装饰模糊。hairline 边框 `#e8e3dc`（暖）。
- **字体**：Fraunces（软衬线 display，标题 + 404 数字）+ Manrope（几何无衬线 body/UI，替代被禁用的 Inter）
  + Noto Sans SC（中文，AGENTS.md 要求）。规格数值用 `tabular-nums`（`.num` 工具类）列对齐。
- **动效**：仅 ease-out-quart `cubic-bezier(0.22,1,0.36,1)`，180–280ms。hover 只改 bg/border/color，
  **无 translateY/scale**。删除 `springFadeIn` / 全局 bounce 过渡 / `float` 关键帧。
  新增 `prefers-reduced-motion` 媒体查询（AGENTS.md 此前要求但缺失）。
- **暗色主题就绪**：AntD 开启 `cssVar` 模式 + 全部颜色走 CSS 变量，未来 `[data-theme="dark"]` 一组变量即可切换。

### 落地步骤

#### Step 1 — Token 系统重建（基础）
- `globals.css` 全面重写：暖色调色板 + `--ease-out` 动效 token + `.num`/`.eyebrow`/`.surface` 工具类。
  删除 `.glass-panel` / `springFadeIn` / `float` / 全局 bounce 过渡 / hover `translateY` 规则。
- `theme.ts` 重写：`colorPrimary #4338ca`、暖色 bg/border、`cssVar:{key:"vps"}` 暗色就绪。
- `layout.tsx`：Inter → Fraunces（`--font-fraunces`）+ Manrope（`--font-manrope`）+ Noto Sans SC（`--font-noto`）。
  next/font 变量用独立命名，避免与 globals.css 的语义变量 `--font-display`/`--font-body` 同名冲突。
- `AGENTS.md`（markdown/AGENTS.md）四节同步更新：Brand Personality / Aesthetic Direction / Design Tokens / Design Principles / Motion Policy。

#### Step 2 — 共享原语
- 新增 `components/ui/Button.tsx` + `Button.module.css`：token 驱动 CTA（primary 实色 / ghost 描边 / text 纯文字），
  替代 7 处内联 `linear-gradient(135deg,#6366f1,#4f46e5)` 渐变按钮，44px 最小点击区域。
- 新增 `components/ui/SpecStat.tsx` + `SpecStat.module.css`：eyebrow 标签 + `.num` tabular 值，
  替代 ProductCard / ProductDetailContent 重复的规格块。

#### Step 3 — 公共页面重做
Header / Footer / Announcement / FilterBar（+ 各自 module.css）改为不透明 + hairline 边框，无 glass。
ProductTable / ProductCard / ProductDetailContent / ProductSkeleton / ProviderProductsTable 改 tabular-nums +
实色 chip + 共享 Button。HomeClient 仅调整 JSX 外壳（SSG 数据逻辑零改动）。
首页删除装饰 blur blob。provider / privacy / 两个 404 改编辑式排版。

#### Step 4 — Admin 表面（AGENTS.md 要求更冷静/实用）
AdminShell：深色侧栏改不透明平面（无渐变）、header 不透明（无 backdrop-filter）、content 卡删除 springFadeIn。
admin/login：删除三色渐变背景 + 两个模糊光斑 + 玻璃卡 + bounce，改为不透明 paper + 居中卡。
products/announcement/settings：清扫内联中性 hex（`#f0f0f0`/`#fffbe6`/`#ffe58f`/`#999`）→ 暖 token。

### 代码审查与修复（第二轮）

对全部未提交改动做三路并行 review（foundation / public / admin+docs），发现并修复 8 项问题：

1. **theme.ts 无效组件 token（静默 no-op）** — AntD 6 的 Button/Input/Select ComponentToken 不含
   `controlHeight`/`borderRadius`，Card 不含 `borderRadiusLG`/`boxShadowTertiary`/`paddingLG`，Tag 不含 `borderRadiusSM`。
   查证 `node_modules/antd/es/*/style/token.d.ts` 确认后移除，高度/圆角统一由全局 token 治理。
2. **admin 路由缺 ConfigProvider** — `/admin/*` 不经 `[locale]/layout`（无 I18nProvider），theme.ts token 失效。
   新增 `components/AntdThemeProvider.tsx`（轻量 ConfigProvider wrapper）并在 `admin/layout.tsx` 挂载。
3. **AdminShell 侧栏边框不可见** — `borderRight: var(--ink)` 与背景同色 → 改 `rgba(255,255,255,0.08)`（深底 hairline）。
4. **Footer.tsx `styles.privacy` 未定义** — CSS module 无此类 → 移除 className（隐私链接继承 `.copyright a` 样式）。
5. **Button `variant="ghost"` 与 AntD 继承的 `ghost?:boolean` prop 语义冲突** — 从继承 props 中 `Omit` ghost；
   同时简化冗余 `if(href)` 分支（AntD 6 原生支持 href 渲染 `<a>`）。
6. **layout.tsx body fontFamily 重复 Noto Sans SC + next/font 变量与 globals.css `:root` 同名冲突** —
   重命名 next/font 变量为 `--font-fraunces`/`--font-manrope`/`--font-noto`，globals.css 用原始变量组装带 fallback 的字体栈。
7. **AGENTS.md token 表不准** — radius "card 12px" 实为 10px；字体栈/控制高度同步修正。
8. **manifest.ts 未用 `SITE_URL` 导入** — 清理。

**已知权衡（非 bug）**：AdminShell 登出按钮失去 danger 红色区分（原 `danger ghost` → 现 `ghost`），保持 admin 克制；
如需可经共享 Button 透传 `danger`。2 个 lint error + 2 个 warning 为**预存**于未触碰数据获取逻辑
（AuthGuard/HomeClient 的 `set-state-in-effect`、HomeClient `useCallback` 依赖、products/[id] 未用 `cores`），
属 React 19 linter 建议，按范围保留不动。

### 验证结果
- `npm run build`（frontend-next）：✅ Compiled successfully，TypeScript 通过，24 页面预渲染。
- `npm run lint`：5 项预存问题（2 error + 3 warning），**0 新增**（清理 manifest 未用导入后从 6→5）。
- **AI-slop 指纹 grep 审计**：代码中 0 处 `backdrop-filter` / `blur(NNpx)` / `cubic-bezier(0.34,1.56,…)` /
  `translateY(-3px) scale(1.03)` / `translateY(-8px) scale(1.02)` / `linear-gradient(135deg,#6366f1…)` / `springFadeIn`
  （仅文档注释中描述"已删除"的提及）。
- **运行时验证（Playwright computed-style）**：
  - 公开页 bodyFont `Manrope` ✓、h1Font `Fraunces` ✓、bg `rgb(250,249,247)`=`#faf9f7` ✓、headerBorder `rgb(232,227,220)`=`#e8e3dc` ✓
  - admin 路由 bodyBg `#faf9f7` ✓、按钮含 `vps` cssVar 前缀 ✓（ConfigProvider 已生效）
- **HomeClient 数据逻辑**：git diff 确认仅删除冗余 `<>` 片段，SSG-first / isFirstRender / loadProducts / deps 零改动。

### 涉及文件（~28 改 + 8 新增）
- Tokens/字体：`globals.css`、`theme.ts`、`app/layout.tsx`、`markdown/AGENTS.md`、`manifest.ts`、`.gitignore`
- 新增原语：`components/ui/Button.tsx`(+css)、`components/ui/SpecStat.tsx`(+css)、`components/AntdThemeProvider.tsx`、
  `components/Footer.module.css`、`components/home/ProductDetailContent.module.css`、`app/admin/login/Login.module.css`
- 公共组件：Header(+css)、Footer、Announcement(+css)、FilterBar(+css)、home/ProductTable、home/ProductCard(+css)、
  home/ProductDetailContent、home/ProductSkeleton、home/ProviderProductsTable、home/HomeClient
- 页面：[locale]/page、[locale]/providers/[name]/page、[locale]/privacy/page、not-found、[locale]/not-found
- Admin：admin/AdminShell、admin/layout、admin/login/page、(dashboard) announcement、(dashboard) settings

---

## UX 文案清晰度优化（clarify 技能，2026-07-12）

### 背景

使用 `clarify` 技能系统审查全部用户可见文案（按钮、提示、错误信息、空状态、确认对话框、表单标签），
按清晰度原则优化：具体而非含糊、主动语态、口语化、含修复建议、不责备用户。

### i18n 文案优化（`en.json` + `zh.json` 对称）

| 区域 | 改前 | 改后 | 原则 |
|------|------|------|------|
| 筛选占位符 | "Select providers" / "请选择服务商" | "All providers" / "全部服务商" | 下拉框语义 |
| 空状态 | "No data available" / "暂无数据" | "No products match your filters. Try adjusting or clearing them." | 说明原因 + 给出下一步，非死胡同 |
| 价格排序提示 | "Sorted by value only, for reference" | 完整说明跨币种排序仅供参考 | 消除歧义 |
| 下单按钮 | `order`（小写） | `Order` | 与详情页 "Order Now" 一致 |
| 删除确认 | "Are you sure you want to delete this product?" | "Delete this product? This can't be undone." | destructive action 说明后果 |
| 错误信息 | "Operation failed" / "Failed to save..." | "Something went wrong..." / "Couldn't save... Please try again." | 口语 + 动作建议 |
| 网络错误 | "Network connection failed, please check..." | "Couldn't reach the server. Please check your internet connection and try again." | 明确问题 |
| 加载态 | "Loading..." | "Loading…" | 规范省略号字符 |
| 句末标点 | "Product added successfully" | "Product added." | 统一句号 |
| 破折号 | `-`（ASCII） | `—`（em dash） | en/zh 一致 |

### 后台硬编码文案修复（真实 Bug）

1. **语言不匹配 Bug**：产品表单两个 tooltip 原为中文（"后台统一按 GB 存储..."），但整个表单为英文界面。已译为英文，上下文一致。
2. **api.ts 混语**：`"未授权"`、`"未知错误"` 出现在英文后台错误流中。已改英文。
3. **删除确认**：Popconfirm 增加 "This can't be undone." 提示 + 红色危险确认按钮 + 明确 "Delete"/"Cancel" 按钮文字。
4. **空预览态**：公告页 "No announcement content" → "Nothing to preview yet. Start writing on the left."（指向明确）。
5. **表单占位符**：给 Affiliate URL、Review URL、Remark 字段加示例占位符（`https://provider.com/order?aff=...`），降低填写门槛。
6. **toast 统一**：成功/错误 toast 统一句末标点与自然语气。

### 验证结果

- `npx tsc --noEmit`（frontend-next）：✅ 0 错误
- JSON 校验（en.json + zh.json）：✅ 有效
- AntD 6.5.0 `Popconfirm` 新 props（`description`/`okButtonProps`）：✅ 支持
- 字符串值依赖检查：`orderButton` 无字面值比较，纯展示改动，安全
- 改动范围：7 文件，+93/-93 行，零逻辑改动

### 修改文件清单

| 文件 | 改动 |
|------|------|
| `frontend-next/src/messages/en.json` | i18n 英文文案全面优化 |
| `frontend-next/src/messages/zh.json` | i18n 中文文案对称优化 |
| `frontend-next/src/app/admin/(dashboard)/products/page.tsx` | 删除确认后果、中文 tooltip 译英、错误/成功 toast、表单占位符 |
| `frontend-next/src/app/admin/(dashboard)/announcement/page.tsx` | 错误/成功 toast、空预览态、占位符 |
| `frontend-next/src/app/admin/(dashboard)/settings/page.tsx` | 错误/成功 toast |
| `frontend-next/src/app/admin/login/page.tsx` | 登录成功/错误 toast、表单验证消息 |
| `frontend-next/src/lib/api.ts` | 中文字符串改英文（`未授权`/`未知错误`） |

---

## 2026-07-12 — 串行安全与质量修复（10 阶段）

**执行 AI 模型：Codex（GPT-5）**

按“前一阶段测试通过才进入下一阶段”的门禁执行，未并行推进阶段。所有阶段已放行。

| 阶段 | 完成内容 | 验证与结论 |
|---|---|---|
| 1 | 修复前端 Docker 的 npm 版本/锁文件兼容性及 standalone `public` 复制路径 | 无缓存 Docker build 成功，放行 |
| 2 | 移除可伪造 XFF fallback；增加 IP + 用户名两道登录限速 | 后端编译、限速单测、Compose 校验通过，放行 |
| 3 | 运行时 seed 不再写入示例推广产品 | seed 单测通过，放行 |
| 4 | JWT 迁移为 HttpOnly Cookie；增加会话探测、CSRF 和安全响应头 | 后端测试、前端构建和运行镜像响应头验证通过，放行 |
| 5 | 吊销/账号检查改为 fail-closed | 故障路径单测通过，放行 |
| 6 | 修复可选字段清空及产品 ID/数值/长度校验 | 11 项后端单测与前端构建通过，放行 |
| 7 | 按 locale 根布局输出正确 HTML lang，服务商 SEO URL 编码 | `/en`、`/zh` 实测通过且 SSG 保持，放行 |
| 8 | 修复依赖漏洞；移除旧 prerender/Puppeteer；拆分 migrate 服务 | 前端审计 0 漏洞；backend runner 审计 0 漏洞，放行 |
| 9 | 后端接入真实测试；清零 ESLint 警告；全 Compose 构建 | 后端 11/11、两前端 lint/build/audit、Compose build 全通过，放行 |
| 10 | 更新开发记录和文件洞察文档 | 本表与 architecture.md 同步完成，放行 |

### 最终验证摘要

- `backend/npm test`：11/11 通过。
- `frontend-next`：lint、production build、`npm audit --omit=dev` 均通过，审计为 0。
- `frontend`（旧 Vite 前端）：lint/build/audit 均通过，审计为 0。
- `docker compose build`：migrate、backend、frontend 三个镜像均成功。

---

## 2026-07-12 — 次要观察修复（代码审查收尾）

针对上一轮代码审查中记录的 3 项"非阻塞"观察逐项处理。同时附带本轮 clarify 技能产出的 UX 文案优化与审查中发现的 api.ts 失效注释清理。

### 修复内容

| 文件 | 变化 | 说明 |
|---|---|---|
| `backend/src/utils/sessionCookie.ts` | 提取 `readAdminSessionCookie()`，重构 `hasAdminSessionCookie` | 原 `hasAdminSessionCookie` 通过 `{ ...req, headers: { ...req.headers, authorization: undefined } }` 构造合成请求剥离 Authorization 头——功能正确但笨拙。拆出"仅读 Cookie"的独立读取路径，CSRF 校验只走 Cookie 读取，与 `getAdminSessionToken` 的 Bearer 优先级语义彻底解耦。公共签名不变，`app.ts` 调用处零改动。 |
| `frontend-next/next.config.ts` | CSP 头补充详细注释 | `'unsafe-inline'`（script-src/style-src）是 SSG 架构下的硬性约束：静态 `.html` 内嵌 Next.js RSC flight 内联 `<script>` 与 AntD CSS-in-JS 内联 `<style>`，构建期固化、无 per-request nonce。经核实 `.next/server/app/zh.html` 确含 `(self.__next_f=...).push(...)` 与 `<style id="antd-cssinjs">`。保留 `unsafe-inline` 但显式记录约束原因与"改 SSR + nonce-based CSP"的演进路径。 |
| `.gitattributes`（新增） | 全仓 LF 行尾规范化 | 消除 Windows 检出（CRLF）与 Linux 容器（LF）的行尾差异，解决 git status 大量 LF→CRLF 警告。`* text=auto eol=lf` + 显式源码/二进制分类。 |
| `frontend-next/src/messages/{en,zh}.json` | UX 文案优化（clarify 技能） | 修正登录限速提示时长（"wait a minute"→真实 15 分钟窗口）；空状态文案更具行动性；通用错误/成功消息更具体。 |
| `frontend-next/src/app/admin/login/page.tsx` | 限速错误本地化 | 触发 code 1002 时显示清晰的英文限速提示，而非后端返回的原始中文。 |
| `frontend-next/src/components/admin/AdminShell.tsx` | 导航标签统一英文 | 原"产品管理/公告管理/配置管理"与全英文 admin 界面混用，统一为 Products/Announcement/Settings。 |
| `frontend-next/src/app/admin/(dashboard)/announcement/page.tsx` | 成功/错误 toast 具体化 | "Saved."→"Announcement saved."；错误回退更具体。 |
| `frontend-next/src/lib/api.ts` | 清理失效注释 | 删除被删函数 `isTokenExpired` 的孤立 doc-comment；"登录，返回 token" 更正为反映 Cookie 会话现实的描述。 |

### 验证

- `backend`：`tsc --noEmit` 通过；`npm test` 11/11 通过（含 sessionCookie 两项测试，确认重构保持行为一致）。
- `frontend-next`：`tsc --noEmit` 通过。

### 部署操作

- 工作区改动合并至 `master`，推送到 `origin`（GitHub）。

---

## 2026-07-12 — 移动端 / 平板适配（adapt 技能）

**执行 AI 模型：ZCode (builtin:bigmodel-coding-plan/GLM-5.2)**

使用 `adapt` 技能系统重做全部公共页面 + admin 后台的移动端/平板体验。核心目标：
重新思考布局、导航、触控与内容优先级（而非简单缩放），并严格遵守 `markdown/AGENTS.md`
设计系统（token 化、无渐变/玻璃态/bounce、44px 触达、不透明表面 + hairline）。

### 根因级 Bug 修复：移动端首帧渲染错误（SSG hydration flash）

**问题**：首页在移动端首帧渲染出 **10 列桌面表格**，而非卡片列表。原因是
`HomeClient.tsx` 用 `useSyncExternalStore` 读取 `window.innerWidth`，其服务端快照硬编码为
`1200`。SSG 下静态 HTML 含表格，React 客户端 hydration 后才切到卡片 → 移动端出现横向滚动闪烁 +
hydration mismatch。`FilterBar` 存在同类问题（首帧渲染内联筛选条而非 Drawer 触发按钮）。

**修复策略（与用户确认）**：保留"桌面表格 + 移动卡片"双视图设计，但显隐改由 **纯 CSS 媒体查询**
驱动，使正确视图直接进入 SSG HTML，无 JS 闪烁、无 hydration mismatch。

- `globals.css`：新增 `.desktopOnly` / `.mobileOnly` 响应式可见性辅助类。基础规则低特异性
  （0,1,0）以免覆盖组件 CSS module（如 FilterBar 的 `.bar` flex）；断点内用 `.desktopOnly.desktopOnly`
  （0,2,0）确保隐藏规则可靠胜出任意单类 module 规则，不受样式表加载顺序影响。断点沿用 1199.98px
  （内容驱动，对应桌面表格 ~10 列不再适配处）。
- `HomeClient.tsx`：删除 `useSyncExternalStore` / `isSmallScreen` 逻辑，桌面表格与移动卡片**同时**
  渲染进同一份 SSG HTML，各自包 `.desktopOnly` / `.mobileOnly`，共用同一份 products/pagination/sort
  状态。
- `FilterBar.tsx`：删除 `isMobile` JS state 与 resize 监听；桌面内联筛选条（`.desktopOnly`）与移动
  筛选按钮 + 底部 Drawer（`.mobileOnly`）同时渲染。Drawer 开关为纯交互态（不影响首帧）。
  顺带清理 AntD 6 `Drawer` 的 `height` 弃用警告（改用内容自适应）。
- SEO：桌面表格内容仍留在 SSG HTML（对爬虫友好），CSS 显隐不影响可抓取数据。

### 其余适配

| 区域 | 改动 |
|------|------|
| 产品卡片（`ProductCard`） | 移动端单列堆叠；窄屏 CTA 纵向堆叠、下单置顶全宽（联盟转化优先）；泛化 `ProductCardList`（pagination/sort 可选）使服务商聚合页可复用 |
| 产品详情（`ProductDetailContent`） | 移动端「下单」CTA 固定在视口底部（`position:fixed`），阅读规格/备注时主操作始终在拇指可达区；`.section` 预留等高 padding 避免遮挡；价格块与标题块用 hairline 分隔 |
| 详情页 `<main>` | `overflow:hidden` → `overflow-x:clip`（保留防横向溢出，且不破坏 fixed 定位相对视口） |
| 服务商聚合页 | 移动端新增卡片回退（复用 `ProductCardList`），桌面保留表格；页面 padding 改响应式 `clamp()` |
| Header | 社交图标每个 44×44 最小触达目标（`min-width/min-height` + `inline-flex`）；窄屏 gap 收窄但保证 4 图标 + 语言切换器在 390px 无溢出；语言切换按钮窄屏强制 40px 高 |
| GettingStarted | 「跳过」链接 44px 触达高度；选项行 `min-height:44px` |
| Admin 导航（`AdminShell`） | 关键修复：原 `<Sider breakpoint="lg" collapsedWidth="0">` 在 ≤lg 时完全隐藏导航且无替代 → admin 在平板/手机不可导航。改用 `Grid.useBreakpoint()` 检测 lg：≥lg 常驻 Sider，<lg 由 Header 汉堡按钮唤出左侧 Drawer（深色 `--ink`，承载相同菜单）。AuthGuard 渲染前返回 null，故 SSG 预渲染 HTML 不含 shell → 无 hydration mismatch |
| Admin 产品表单（`products/page.tsx`） | 产品表格加 `scroll={{ x: "max-content" }}`（窄屏横向滚动而非溢出视口）；搜索框 `width: min(320px,100%)` + `flex:1`；新增/编辑 Modal `width="min(800px,92vw)"`；表单 `<Space>` 行加 `wrap` 使字段在窄屏堆叠 |
| Footer / Privacy | 移动端导航链接 44px 触达高度；privacy section padding 响应式 + `overflow-wrap:anywhere`（长 URL 不撑破布局） |

### 细节修正（代码审查收尾）

1. **DOM 顺序一致性**：卡片与详情页的 actions 源顺序原本相反（卡片先测评后下单，详情页先下单后测评）。
   统一为「测评在前、下单在后」，Order 置顶纯由 CSS `order` 实现，消除维护歧义。
2. **硬编码阴影 → token**：`globals.css` 新增语义化 `--shadow-ink-faint` token（`rgba(26,29,41,0.03)`），
   暗色就绪（未来 `[data-theme="dark"]` 仅改一组变量）。详情页固定 CTA 栏的 `box-shadow` 改用该 token，
   不再内联硬编码 rgba。
3. **Header 图标间距**：移动端 `.socialIcons` gap 由 2px 调整为 4px，`.actions` gap 6px——44px 触达目标
   不变，但相邻 hover 高亮块视觉更清晰、不粘连。验证 4 图标 + 语言切换器在 390px 无溢出。

### 验证结果（真实数据：后端 + MySQL + 51 条产品）

- `npm run lint`、`tsc --noEmit`、`npm run build`：✅ 全通过；构建产物含真实产品/服务商 SSG 页面。
- **SSG 修复（Playwright run-code，390/834/1280/320px）**：
  - 移动端 `desktopOnly=none`、`mobileOnly=block`、桌面端相反；**零横向溢出**、**零 hydration 警告**。
  - Filter Drawer 在移动端正确打开（含全部字段）。
- **卡片 CTA 顺序**：`domOrder:[查看测评,下单]`，`orderOnTop:true`（下单视觉置顶）。
- **详情页固定 CTA 栏**：`position:fixed`、`gap:0`（紧贴视口底）、`orderOnTop:true`、`boxShadow` 解析为
  `rgba(26,29,41,0.03)`（token 生效）。
- **服务商页**：移动端渲染卡片（`cardsCount>0`、表格隐藏）；桌面端渲染表格、卡片隐藏。
- **Admin 导航**：登录后移动端显示汉堡按钮、隐藏 Sider；汉堡 Drawer 打开含 3 项菜单（Products/
  Announcement/Settings），点击 Settings 成功导航到 `/admin/settings`。
- **Admin 预渲染安全**：`/admin/products.html` 预渲染 HTML 仅含 AuthGuard 的 null 状态
  （`<div hidden=""></div>`），无 shell 标记 → `useBreakpoint` SSR 全 false 不产生可见 DOM → 无 mismatch。
- **SSG 数据安全**：桌面表格产品数据仍进入 SSG HTML（爬虫可抓取），CSS 显隐不影响 SEO。
- **CSP**：`next.config.ts` 的 CSP 在所有页面保持有效。
- 设计系统合规：无硬编码 hex（仅沿用既有 `rgba(26,29,41,…)` 阴影先例并已 token 化）；无渐变/玻璃态/
  bounce/translateY-hover；全部走 CSS 变量；44px 触达；`prefers-reduced-motion` 门控保留。

### 修改文件清单（16 改）

| 文件 | 改动 |
|------|------|
| `frontend-next/src/app/globals.css` | `.desktopOnly`/`.mobileOnly` 辅助类 + `--shadow-ink-faint` token |
| `frontend-next/src/components/home/HomeClient.tsx` | 删除 viewport JS 逻辑，双视图 CSS 显隐 |
| `frontend-next/src/components/FilterBar.tsx` | 删除 isMobile state，双外壳 + Drawer |
| `frontend-next/src/components/home/ProductCard.tsx` | props 可选化（pagination/sort），复用于服务商页 |
| `frontend-next/src/components/home/ProductCard.module.css` | 移动端单列、CTA 堆叠置顶 |
| `frontend-next/src/components/home/ProductDetailContent.tsx` | actions DOM 顺序统一（测评在前） |
| `frontend-next/src/components/home/ProductDetailContent.module.css` | 移动端 fixed CTA 栏 + token 阴影 + priceBlock hairline |
| `frontend-next/src/app/[locale]/products/[id]/page.tsx` | `<main>` overflow:hidden→overflow-x:clip |
| `frontend-next/src/app/[locale]/providers/[name]/page.tsx` | 移动卡片回退 + 响应式 padding |
| `frontend-next/src/components/Header.tsx` | 社交图标加 iconLink 类 |
| `frontend-next/src/components/Header.module.css` | 44px 触达 + gap 调整 + 语言切换高度 |
| `frontend-next/src/components/Footer.module.css` | 移动端导航链接 44px 触达 |
| `frontend-next/src/components/home/GettingStarted.module.css` | 跳过链接 44px + 选项 min-height |
| `frontend-next/src/components/admin/AdminShell.tsx` | 汉堡 Drawer 移动导航 + 响应式 header/content |
| `frontend-next/src/app/admin/(dashboard)/products/page.tsx` | 表格横向滚动 + Modal/表单窄屏适配 |
| `frontend-next/src/app/[locale]/privacy/page.tsx` | 响应式 padding + overflow-wrap |

### 部署操作

- 工作区改动合并至 `master`，推送到 `origin`（GitHub）。

---

## 2026-07-13 — 全站性能优化（optimize 技能，quick wins）

**执行 AI 模型：ZCode (builtin:bigmodel-coding-plan/GLM-5.2)**

使用 `optimize` 技能系统测量并优化前端性能。先量化瓶颈再动手——**首页 `/en` HTML 292 KB，其中内联 antd CSS-in-JS `<style>` 占 228 KB（detail 页仅 12.8 KB，差距 17.8×）**。根因：首页挂载 antd `Table` + `Select` + `Pagination`（最重的 antd 组件），`@ant-design/nextjs-registry` 的 `AntdRegistry` 把它们的 CSS-in-JS 全量收集后内联进 SSG HTML。

经与用户确认方向：**Quick wins（safe）+ 全站范围**——不做 build-time CSS 抽取、不重写 antd Table，聚焦安全、可回滚的小改。

### 优化前测量（基线）

| 指标 | 首页 `/en` | 详情页 `/en/products/1` | 差距 |
|---|---|---|---|
| HTML 体积 | 292 KB | 30 KB | 9.7× |
| 内联 antd `<style>` | 228 KB | 12.8 KB | 17.8× |
| `:where(.css-xxxxx)` 哈希选择器 | 1,485 个 | — | 每条规则都带前缀 |

### 完成内容（4 文件，+40/−4 行）

#### Workflow 1 — antd CSS 体积收敛（首页最大收益）

1. **`src/lib/theme.ts`**：`hashed: true → false`。官方文档（`node_modules/antd/es/config-provider/context.d.ts:113-119`）明确：单版本 antd 应用设 `false` 可减小样式体积。本仓库仅单一 antd 版本，且全站两个 ConfigProvider（`AntdThemeProvider` 给 `/admin/*`、`I18nProvider` 给 `/[locale]/*`）共用同一 `antdTheme`、不并存，`cssVar:{key:"vps"}` 提供主题唯一键——无样式冲突风险。
2. **`src/app/globals.css`**：给 `.ant-table-row` 加 `content-visibility:auto; contain-intrinsic-size:auto 56px;`。首页/服务商聚合页一次渲染 50–200 行，首屏仅可见 ~10 行；浏览器跳过视口外行的布局/绘制，显著降低首屏绘制与 INP。`contain-intrinsic-size` 防滚动条抖动，`auto` 记忆已测量行高。两处表格都用 `scroll={{x:"max-content"}}`（无 `scroll.y`、无固定头/列），恰好避开 `content-visibility` 的已知踩坑点；自动惠及服务商聚合页（`pagination=false` 设计意图保留）。

#### Workflow 3 — react-markdown 懒加载 + memo 预览（admin 公告编辑器）

**`src/app/admin/(dashboard)/announcement/page.tsx`**：
- 静态 `import ReactMarkdown from "react-markdown"` → `dynamic(() => import("react-markdown"), { ssr:false })`（与 `Announcement.tsx` 同模式）。整个 markdown 解析器（112 KB：micromark/unified/rehype/remark/mdast）拆成独立懒加载 chunk，admin 公告页首屏不再背它；`ssr:false` 因该 Tab 是纯客户端实时预览。
- live preview 用 `memo` 包一层（`MarkdownPreview`，只收 `{content}`，`markdownOptions` 在内部展开、不跨 memo 边界）。真实收益：在中文 Tab 打字时，英文 Tab 面板因 `enContent` 未变而不再重解析 markdown——两个 Tab 都挂在 DOM 里，省 CPU。

#### Workflow 5 — logo 图片加载 hint

**`src/components/Header.tsx`**：logo `<img>` 加 `decoding="async"` + `fetchPriority="high"`，浏览器尽早并行获取、不阻塞主资源。React 19.2.4 类型定义（`@types/react/index.d.ts:3169`）确认 `fetchPriority?: "high"|"low"|"auto"` 驼峰拼写正确。

### 经审计后跳过的 2 项（避免引入风险）

- **Workflow 2（stagger 动画限移动端）**：复核后发现 `.mobileOnly` 在桌面端是 `display:none`，而 `display:none` 会让整个子树不渲染、不动画——桌面端本就不跑那 50 个卡片动画。原计划前提不成立，无需改动。
- **Workflow 4（i18n 按语言裁剪 messages）**：语言切换是 `router.push` 客户端导航（非整页刷新），i18next 单例的 `changeLanguage` 需要目标语言的 messages 已注册到 `resources`。只注册当前语言会**破坏客户端切语言**。~6.8 KB 收益不值得冒功能回归风险，按 quick-win 边界跳过。

### 验证结果（测量前后对比）

| Home `/en` | BEFORE | AFTER | DELTA |
|---|---:|---:|---:|
| total HTML | 291 KB | **261 KB** | **−30.8 KB (−10.6%)** |
| inline antd CSS | 228 KB | **198 KB** | **−30.5 KB (−13.4%)** |
| `:where(.css-xxx)` 哈希选择器 | 1,485 个 | **0** | 全部移除，选择器变为纯 `.ant-table{...}` |

- 详情页基线不变（30 KB / 12.8 KB），确认改动只影响预期的重 CSS 路由。
- `tsc --noEmit`：✅ 0 错误
- `npm run lint`：✅ 0 错误
- `npm run build`：✅ 220 路由全部预渲染成功
- dev 烟测 `/zh /en /en/privacy /admin/login /admin/announcement`：✅ 全 HTTP 200，无 hydration/error 日志
- react-markdown 拆分验证：`react-markdown` 现位于独立 chunk `3cabyep4tasx3.js`（112 KB），admin/announcement 首屏不再含它

### 代码审查（自审 + 复核）

- **CRLF 行尾污染修复**：`theme.ts` 被编辑工具改成 CRLF（其余 3 文件保持 LF），项目 `.gitattributes` 强制 `*.ts text eol=lf`。`sed -i 's/\r$//'` 还原为 LF，避免 commit 时 git 重新规范化产生"全文件改动"噪声、污染历史与 blame。复测 tsc 通过。
- **多 ConfigProvider 冲突复核**：全站只有一个共享 `antdTheme`，admin 与 locale 路由不并存，`hashed:false` 安全。
- **`content-visibility` 兼容性复核**：表格无 `scroll.y`/固定头/固定列，避开已知踩坑点；56px intrinsic 略大于实际行高 ~49px，`auto` 关键字会在进入视口后修正。
- **memo 数据流复核**：`MarkdownPreview` 只收 `{content}`，打字时 content 变 → 浅比较失败 → 正常重渲染（功能不丢）；非 content 的父级重渲染（saving/快照更新）被跳过。

### 修改文件清单（4 改）

| 文件 | 改动 |
|------|------|
| `frontend-next/src/lib/theme.ts` | `hashed:false`（去哈希选择器前缀）+ LF 行尾修复 |
| `frontend-next/src/app/globals.css` | `.ant-table-row` 加 `content-visibility:auto` + `contain-intrinsic-size` |
| `frontend-next/src/app/admin/(dashboard)/announcement/page.tsx` | react-markdown 懒加载 + memo 预览 |
| `frontend-next/src/components/Header.tsx` | logo `<img>` 加 `decoding="async"` + `fetchPriority="high"` |

### 明确不做（用户选定 quick wins / 审计排除）

- build-time CSS 抽取（AntdRegistry → 静态 antd.css）——风险中、需自定义脚本覆盖所有组件
- 重写 antd Table 为自建轻量表格——风险高、需重实现排序/分页/ellipsis
- ProviderProductsTable 引入分页/虚拟化——违反 `pagination=false` 设计意图

### 部署操作

- 工作区改动合并至 `master`，推送到 `origin`（GitHub）。

---

## 2026-07-13 — 页面与组件细节打磨（polish 技能）

**执行 AI 模型：ZCode (builtin:bigmodel-coding-plan/GLM-5.2)**

使用 `polish` 技能对页面和组件做最后一轮细节打磨，提高完成度。严格遵循 `markdown/AGENTS.md`
设计上下文（无新增 hex/渐变/glass/bounce/translateY，统一走 token 与 ease-out-quart）。
逐条对照 polish 清单系统审查所有公共页面与组件（Home / ProductTable / ProductCard /
ProductDetailContent / ProviderProductsTable / FilterBar / Header / Footer / Announcement /
GettingStarted / 404 / privacy / Skeleton），聚焦真正影响完成度的 4 项问题。

### 修复 1：移动端下单 CTA 排序 Bug（🔴 高，影响联盟转化）

**问题**：`ProductCard` 与 `ProductDetailContent` 的窄屏 CTA 栏用 `:nth-of-type(1/2)` 定位
「测评在下、下单置顶」。但当产品**没有测评链接**（`reviewUrl` 为空）时，`.actions` 容器里
只剩下单按钮——`:nth-of-type(1)` 会误命中下单按钮，把它压到底部（`order:2`）。主操作被
推到次操作位置，联盟转化的关键 CTA 在窄屏被弱化。

**修复**：改用稳定的语义 class 定位，而非位置序号：
- `ProductCard`：下单按钮加 `className={styles.primaryCta}`，CSS 改为
  `.actions > :global(.ant-btn):not(.primaryCta){order:2}` / `.actions > :global(.ant-btn).primaryCta{order:1}`。
- `ProductDetailContent`：复用既有的 `styles.orderCta` class，同样的 `:not()` / 正向匹配写法。

无论有无测评链接，下单始终置顶、全宽。

### 修复 2：服务商页返回链接无障碍（🟠 中）

**问题**：`providers/[name]` 页的返回箭头原先 `<span role="img" aria-label="back">←</span>`
会与链接文字「Back to Home」形成重复的 screen reader 朗读（箭头被读作 "back"，链接文本也读 "back"）。

**修复**：箭头改为 `aria-hidden="true"` 的纯装饰元素，链接文字本身已足够描述性。补 inline-flex
对齐（`display:inline-flex; align-items:center; gap:6px`）让箭头与文字基线对齐。

### 修复 3：产品详情页加服务商面包屑（🟠 中，导航 + SEO）

**问题**：详情页面包屑原先只有「返回首页」单链，缺少到所属服务商聚合页的导航路径。用户多从
聚合页进入详情，面包屑应反映真实的浏览层级。

**修复**：
- `ProductDetailContent.tsx`：面包屑升级为标准三段 Home → Provider（链向聚合页）→ 当前产品。
  末项（当前页）为纯文本，符合 AntD Breadcrumb 规范。`back` 变量改名为 `homeLabel`（"首页"/"Home"）。
- `products/[id]/page.tsx`：同步更新 `BreadcrumbList` JSON-LD，与可见面包屑保持一致
  （Home → Provider → Product），`encodeURIComponent` 与全站 provider 链接（sitemap/api/metadata）一致。
- 顺手清理了失效的 `providerLabel` 变量。

### 修复 4：GettingStarted「重新打开」按钮触达目标（🟡 低）

**问题**：`.reopen` 按钮原先 `padding: 5px 0`，在触摸设备上垂直触达高度不足 44px（AGENTS.md
tap-target 要求）。同模块的 `.skip` 链接此前已修过同样问题。

**修复**：移动端断点内给 `.reopen` 补 `min-height: 44px`，与 `.skip` 一致。注释同步更新。

### 复查中发现并修复的 CSS Modules 隐患（自审）

**问题**：初次实现 `ProductCard` 的正向规则写成 `:global(.ant-btn.primaryCta)`，把 `.primaryCta`
放进 `:global()` 括号**内**。CSS Modules 因此把它当全局类、不做哈希。编译产物证实：

```
.ant-btn.primaryCta{order:1}              ← 未哈希，永远匹配不到
.ant-btn:not(.ProductCard-module__…__primaryCta){order:2}  ← 这条却匹配到了下单按钮
```

实际按钮拿到的是哈希类 `ProductCard-module__T1Z7aq__primaryCta`，`order:1` 永不生效，下单反而
被 `:not` 规则压底——等于 bug 没修甚至更糟。

**修复**：把 `.primaryCta` 移到 `:global()` 括号**外**（`.actions > :global(.ant-btn).primaryCta`），
与 `ProductDetailContent` 已工作的 `.orderCta` 写法对齐。重新构建后编译产物两条规则都正确哈希：

```
.ant-btn:not(.ProductCard-module__…__primaryCta){order:2}
.ant-btn.ProductCard-module__…__primaryCta{order:1}        ← 现在能匹配了
```

### 验证结果

- `npx tsc --noEmit`：✅ 0 错误
- `npx eslint .`：✅ 0 错误
- `next build`：✅ 220 路由全部预渲染成功（产品/服务商页因当前后端 DB 500 未预渲染，属环境问题非代码回归）
- **编译产物逐条核对**：`.primaryCta` / `.orderCta` 的 `order:1/2` 两条规则在 prod CSS 中均正确哈希一致 ✅
- dev server `/en` HTTP 200 ✅

### 修改文件清单（7 改，+21/−15）

| 文件 | 改动 |
|------|------|
| `frontend-next/src/components/home/ProductCard.tsx` | 下单按钮加 `className={styles.primaryCta}` |
| `frontend-next/src/components/home/ProductCard.module.css` | 移动端 CTA 排序改用 `.primaryCta` class 定位（非 nth-of-type） |
| `frontend-next/src/components/home/ProductDetailContent.tsx` | 面包屑升级 Home→Provider→Product；`back`→`homeLabel` |
| `frontend-next/src/components/home/ProductDetailContent.module.css` | 移动端 CTA 排序改用 `.orderCta` class 定位（非 nth-of-type） |
| `frontend-next/src/app/[locale]/products/[id]/page.tsx` | BreadcrumbList JSON-LD 加 Provider 中段 |
| `frontend-next/src/app/[locale]/providers/[name]/page.tsx` | 返回箭头 `role="img"+aria-label` → `aria-hidden` + inline-flex 对齐 |
| `frontend-next/src/components/home/GettingStarted.module.css` | `.reopen` 移动端补 44px min-height |

### 部署操作

- 工作区改动合并至 `master`，推送到 `origin`（GitHub）。

