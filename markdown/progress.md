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
