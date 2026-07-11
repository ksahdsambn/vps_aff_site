# 架构与文件洞察（Next.js 迁移）

> 本文件记录每个文件的作用，随迁移进度持续更新。

---

## 旧前端（frontend/ — Vite + React 19 SPA）

| 文件 | 作用 |
|---|---|
| `index.html` | SPA 入口 HTML，含静态 SEO meta、Google Fonts、JSON-LD WebSite |
| `vite.config.ts` | Vite 配置：react 插件 + vite-plugin-prerender（Puppeteer 预渲染 `/`）+ dev proxy `/api` |
| `src/main.tsx` | 应用入口，AntD ConfigProvider 主题配置（colorPrimary #6366f1 等） |
| `src/App.tsx` | BrowserRouter 路由定义（`/`、`/admin/*`） |
| `src/i18n.ts` | i18next 初始化，localStorage 存储语言偏好 |
| `src/index.css` | 全局样式（glassmorphism、动画、自定义滚动条） |
| `src/api/index.ts` | axios 实例 + 类型定义 + 公共/Admin API 函数 |
| `src/locales/zh.json` `en.json` | 中英文翻译资源 |
| `src/components/Header.tsx` | 公共页头（logo、标题、社交链接、语言切换） |
| `src/components/FilterBar.tsx` | 筛选栏（服务商多选、关键词、位置） |
| `src/components/Announcement.tsx` | 公告区（Markdown 渲染） |
| `src/components/AuthGuard.tsx` | Admin 路由守卫（JWT 过期检查） |
| `src/components/SEO.tsx` | react-helmet-async SEO 组件 |
| `src/pages/Home/index.tsx` | 首页容器（产品列表、筛选、分页、排序） |
| `src/pages/Home/ProductTable.tsx` | 桌面端产品表格 |
| `src/pages/Home/ProductCard.tsx` | 移动端产品卡片列表 |
| `src/pages/Home/ProductSkeleton.tsx` | 加载骨架屏 |
| `src/pages/Admin/AdminLayout.tsx` | Admin 布局（Sider + Outlet） |
| `src/pages/Admin/Login.tsx` | Admin 登录页 |
| `src/pages/Admin/Products.tsx` | Admin 产品 CRUD |
| `src/pages/Admin/Announcement.tsx` | Admin 公告编辑（Markdown） |
| `src/pages/Admin/Settings.tsx` | Admin 站点配置 |

## 后端（backend/ — Express 5 + Prisma 7 + MySQL）

| 文件 | 作用 |
|---|---|
| `src/index.ts` | 服务入口，加载 dotenv，监听 PORT |
| `src/app.ts` | Express 应用（helmet/cors/compression/rate-limit/路由挂载/404/错误处理） |
| `src/routes/productRoutes.ts` | 公共路由 `/api/products`、`/api/providers` |
| `src/routes/configRoutes.ts` | 公共路由 `/api/config` |
| `src/routes/adminRoutes.ts` | Admin 路由 `/api/admin/*`（JWT 保护） |
| `src/controllers/productController.ts` | getProducts（分页/筛选/排序）、getProviders |
| `src/controllers/configController.ts` | getConfig（站点配置） |
| `src/controllers/adminController.ts` | login、产品 CRUD、配置更新 |
| `src/middleware/auth.ts` | JWT Bearer 认证 |
| `src/middleware/rateLimiter.ts` | 全局/登录限流 |
| `src/middleware/errorHandler.ts` | 统一错误处理 |
| `src/utils/db.ts` | PrismaClient 单例（MariaDB adapter） |
| `src/utils/response.ts` | 统一响应封装 `{code, data, message}` |
| `src/utils/secrets.ts` | JWT 密钥、Admin 凭据获取 |
| `src/utils/seedData.ts` | 种子数据（51 产品 + 9 配置 + admin） |
| `prisma/schema.prisma` | 数据模型（Product / SystemConfig / Admin） |

## 部署

| 文件 | 作用 |
|---|---|
| `docker-compose.yml` | 编排 db（MySQL）+ backend + frontend（nginx） |
| `docker/frontend/Dockerfile` | 前端构建（Node + Puppeteer/Chromium → nginx 静态托管） |
| `docker/nginx/default.conf` | Nginx 反代 `/api/` + SPA fallback |
| `scripts/update-from-github.sh` | 服务器拉取更新脚本 |

---

## 新前端（frontend-next/ — Next.js App Router）

### 阶段 1 产物

| 文件 | 作用 |
|---|---|
| `next.config.ts` | Next.js 配置：`output: 'standalone'`、`reactStrictMode`、rewrites 将 `/api/*` 代理到后端 |
| `package.json` | 依赖清单（AntD 6、i18next、react-markdown 等）；移除 react-helmet-async/react-router/vite-plugin-prerender/puppeteer |
| `tsconfig.json` | TS 配置，路径别名 `@/*` → `./src/*` |
| `src/app/layout.tsx` | 根布局：next/font（Inter+Noto Sans SC）、AntdRegistry（SSR 样式注入）、基础 metadata |
| `src/app/globals.css` | 全局样式（从旧 index.css 迁移：glassmorphism、动画、滚动条、`.sr-only`） |
| `src/app/page.tsx` | 根路径 `/` → redirect("/zh") |
| `src/app/[locale]/page.tsx` | 占位首页（客户端组件，验证 AntD；阶段 3 改造为 SSG） |
| `src/lib/api.ts` | API 客户端 + 类型定义（公共 fetch 封装 + Admin axios 实例 + JWT 拦截器） |
| `src/lib/theme.ts` | AntD 主题配置（从旧 main.tsx ConfigProvider theme 迁移） |
| `src/lib/markdown.ts` | ReactMarkdown rehype-sanitize 安全配置 |
| `src/messages/zh.json` `en.json` | 中英文翻译资源（从旧 locales/ 复用） |
| `public/favicon.svg` | 站点图标（从旧前端复用） |
| `@ant-design/nextjs-registry` | AntD + App Router 官方 SSR 样式注入方案（替代手动 cssinjs StyleRegistry） |

### 阶段 2 产物

| 文件 | 作用 |
|---|---|
| `src/lib/i18n.ts` | i18n 纯数据（locales/defaultLocale/localeToHtmlLang/messages/resolveLocale），无 react-i18next，RSC 安全 |
| `src/lib/i18n-client.ts` | 客户端 i18next 初始化（createContext），仅 'use client' 组件导入 |
| `src/app/[locale]/layout.tsx` | locale 段 Server Component：校验 locale（无效 404）+ generateStaticParams + generateMetadata（hreflang alternates） |
| `src/components/I18nProvider.tsx` | 客户端 provider：I18nextProvider + AntD ConfigProvider + LangSync |
| `src/components/LangSync.tsx` | 客户端组件：水合后同步 <html lang> |
| `src/components/LanguageSwitcher.tsx` | 语言切换器：URL 路由跳转（替代 localStorage 切换），localStorage 仅记忆偏好 |
| `src/app/page.tsx` | 根路径 `/` → 根据 Accept-Language 重定向到 /zh 或 /en |

### 阶段 3 产物

| 文件 | 作用 |
|---|---|
| `src/app/[locale]/page.tsx` | 首页 Server Component：服务端 fetch 产品+服务商+配置，SSG 输出完整 HTML，generateMetadata 按语言动态 title/description/canonical/hreflang |
| `src/components/home/HomeClient.tsx` | 首页 client island：接收 SSG 初始产品数据首帧渲染，筛选/排序/分页走客户端 getProducts |
| `src/components/Header.tsx` | 公共页头（客户端）：标题 h1、社交链接、LanguageSwitcher |
| `src/components/Announcement.tsx` | 公告区（客户端）：config 驱动 Markdown 渲染 |
| `src/components/FilterBar.tsx` | 筛选栏（客户端）：服务商多选（服务端预取传入）、关键词、位置、移动端 Drawer |
| `src/components/home/ProductTable.tsx` | 桌面端产品表格（客户端） |
| `src/components/home/ProductCard.tsx` | 移动端产品卡片列表（客户端） |
| `src/components/home/ProductSkeleton.tsx` | 加载骨架屏（客户端，仅后续加载状态） |
| `src/lib/api.ts` 增强 | 服务端 fetch 用绝对地址 SERVER_BACKEND_URL（解决构建时相对路径问题）+ 8s 超时降级 |

### 阶段 4 产物

#### 后端新增

| 文件 | 作用 |
|---|---|
| `backend/src/controllers/productController.ts`（增强） | 新增 `getAllProductIds`（ID 列表）、`getProductById`（单产品详情，404）、`getProductsByProvider`（服务商聚合） |
| `backend/src/routes/productRoutes.ts`（重写） | 新增 `/products/all`、`/products/:id`、`/providers/:name/products` 路由（all 在 :id 前避免冲突） |

#### 前端新增

| 文件 | 作用 |
|---|---|
| `src/app/[locale]/products/[id]/page.tsx` | 产品详情页（ISR revalidate=3600）：generateStaticParams 预生成、JSON-LD（Product/Offer/BreadcrumbList）、动态 metadata |
| `src/app/[locale]/providers/[name]/page.tsx` | 服务商聚合页（SSG）：generateStaticParams 预生成、JSON-LD（ItemList/Brand）、产品表格、动态 metadata |
| `src/components/home/ProductDetailContent.tsx` | 产品详情内容 client island（AntD 组件） |
| `src/components/home/ProviderProductsTable.tsx` | 服务商聚合页产品表格 client island（含到详情页的链接） |
| `src/lib/api.ts`（增强） | 新增 `getAllProductIds`、`getProductById`、`getProductsByProvider` 客户端/服务端封装 |

### 阶段 5 产物

| 文件 | 作用 |
|---|---|
| `src/lib/api.ts`（增强） | 新增 Admin API 封装（adminLogin/adminGetProducts/adminAddProduct/adminUpdateProduct/adminDeleteProduct/adminGetConfig/adminUpdateConfig），基于动态 getAdminApi axios + JWT |
| `src/app/admin/layout.tsx` | Admin 根布局：仅 metadata（robots noindex），不含 AuthGuard |
| `src/app/admin/login/page.tsx` | 登录页（客户端）：不经过 AuthGuard |
| `src/app/admin/(dashboard)/layout.tsx` | 受保护路由组布局：AuthGuard + AdminShell |
| `src/app/admin/(dashboard)/page.tsx` | /admin → redirect /admin/products |
| `src/app/admin/(dashboard)/products/page.tsx` | 产品 CRUD（客户端），含编辑 diff 算法 |
| `src/app/admin/(dashboard)/announcement/page.tsx` | 公告管理（客户端）：中英文双 Tab Markdown 编辑器 |
| `src/app/admin/(dashboard)/settings/page.tsx` | 配置管理（客户端）：站点标题/Logo/社交链接 |
| `src/components/admin/AuthGuard.tsx` | 客户端路由守卫：JWT 过期检查，无效跳转登录 |
| `src/components/admin/AdminShell.tsx` | Admin 外壳（Sider/Header/Content），react-router → Next.js router 迁移 |

### 阶段 6-13 产物

| 文件 | 阶段 | 作用 |
|---|---|---|
| `src/lib/seo.ts` | 6/7 | SEO 共享配置（SITE_URL/SITE_NAME）+ JSON-LD 生成器（Organization/WebSite/Product/BreadcrumbList/ItemList） |
| `public/og-default.png` | 6 | 1200×630 社交分享占位图（sharp 生成，indigo-violet-pink 渐变品牌图） |
| `src/app/layout.tsx`（增强） | 6/13 | 完整 metadata（metadataBase/title template/OG/twitter/keywords/robots/verification）+ Organization+WebSite JSON-LD + GA4(GoogleAnalytics) |
| `src/app/[locale]/page.tsx`（增强） | 7 | 首页注入 ItemList + Product @graph JSON-LD |
| `src/app/[locale]/products/[id]/page.tsx`（重构） | 7 | 使用 lib/seo.ts 生成器替代内联 JSON-LD |
| `src/app/[locale]/providers/[name]/page.tsx`（重构） | 7 | 使用 lib/seo.ts generateItemListJsonLd |
| `src/components/Header.tsx`（增强） | 8 | asH1 prop 控制标题层级（首页 h1，详情/聚合页 div） |
| `src/components/Footer.tsx` | 8 | 公共页脚（版权/社交链接/语言切换/隐私链接） |
| `src/components/Announcement.tsx`（增强） | 10 | react-markdown 懒加载（next/dynamic）减小首屏 JS |
| `src/app/sitemap.ts` | 9 | 动态 sitemap（首页+产品+服务商 × 2 语言，含 hreflang + lastmod + priority） |
| `src/app/robots.ts` | 9 | 动态 robots.txt（Allow / + Disallow /admin/ /api/ + Sitemap 声明） |
| `src/app/manifest.ts` | 9 | PWA manifest |
| `src/app/not-found.tsx` | 11 | 友好 404 页面（原生 HTML，玻璃拟态卡片 + 返回首页） |
| `docker/nginx/default.conf`（重写） | 11 | 反代到 Next.js server（frontend:3000），移除 SPA fallback |
| `docker/frontend/Dockerfile`（重写） | 12 | Next.js standalone 构建（移除 Puppeteer/Chromium），runner 运行 server.js |
| `docker-compose.yml`（更新） | 12 | frontend 服务端口 3000 + 环境变量（BACKEND_URL/SITE_URL/GSC/GA4） |
| `.env.example`（更新） | 12 | 新增 NEXT_PUBLIC_SITE_URL/BACKEND_URL/GSC_VERIFICATION/GA_ID |
| `docs/deployment.md`（更新） | 12 | 架构变更说明 + 端口 3000 + docker-compose frontend 段示例 |
| `backend/src/controllers/productController.ts`（增强） | 4 | 新增 getAllProductIds/getProductById/getProductsByProvider |
| `backend/src/routes/productRoutes.ts`（重写） | 4 | 新增 /products/all、/products/:id、/providers/:name/products 路由 |

### 代码审查修复产物

| 文件 | 修复 | 作用 |
|---|---|---|
| `.dockerignore`（更新） | 1 | 新增 frontend-next/node_modules、.next、.env* 排除，避免构建上下文膨胀 |
| `docker/nginx/default.conf`（增强） | 2 | 文件头注释说明：未被 Docker 引用，仅作 1Panel/OpenResty 反代参考 |
| `src/app/[locale]/not-found.tsx`（新增） | 3 | [locale] 段内 404 页面，带 locale 上下文（中英双语），params 可选降级 |
| `src/app/sitemap.ts`（优化） | 4 | 移除冗余 getProducts 调用，复用 getAllProductIds 的 updatedAt 计算 lastmod |
| `src/lib/api.ts`（增强） | 4 | getAllProductIds 返回类型改为 `ProductIdWithUpdated[]`（{id, updatedAt}） |
| `src/app/[locale]/products/[id]/page.tsx`（适配） | 4 | generateStaticParams 适配新的 {id, updatedAt} 返回格式 |
| `backend/src/controllers/productController.ts`（增强） | 4/5 | getAllProductIds 返回 {id, updatedAt}；getProductById 用 parseInt(id,10) 替代 Number() |

### 第二轮审查修复产物

| 文件 | 修复 | 作用 |
|---|---|---|
| `src/app/[locale]/privacy/page.tsx`（新增） | 1 | 隐私政策页（SSG，双语，5 段落），含 generateStaticParams + generateMetadata |
| `src/components/home/HomeClient.tsx`（精简） | 2/7 | 删除 config 死代码（state + loadConfig effect + 导入），useRef 改具名导入 |
| `src/lib/seo.ts`（增强） | 3 | 新增 `safeJsonLd()` 函数（JSON.stringify 后转义 `<` 为 `\u003c`，防 `</script>` 逃逸） |
| `src/app/layout.tsx`（增强） | 3/4 | JSON-LD 改用 safeJsonLd；`<html>` 加 suppressHydrationWarning |
| `src/app/[locale]/page.tsx`（增强） | 3/5 | JSON-LD 改用 safeJsonLd；generateMetadata 用 SITE_URL 常量替代内联 |
| `src/app/[locale]/products/[id]/page.tsx`（增强） | 3/5 | JSON-LD 改用 safeJsonLd；generateMetadata 用 SITE_URL 常量 |
| `src/app/[locale]/providers/[name]/page.tsx`（增强） | 3/5 | JSON-LD 改用 safeJsonLd；generateMetadata 用 SITE_URL 常量 |
| `src/app/[locale]/layout.tsx`（增强） | 5 | generateMetadata 用 SITE_URL 常量替代内联 process.env |
| `src/components/LanguageSwitcher.tsx`（增强） | 6 | 新增 hasLocalePrefix guard，无 locale 前缀时回退到首页 |
| `src/components/LangSync.tsx`（更新注释） | 4 | 注释说明 suppressHydrationWarning + content-language 缓解策略 |
