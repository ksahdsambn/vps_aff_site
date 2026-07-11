# Next.js 迁移 + SEO 全面修复方案（合并版）

> **真实域名**：`xmde.de`（从环境变量 `NEXT_PUBLIC_SITE_URL` 读取，消灭所有 `your-domain.com` 占位符）
> **后端**：Express + Prisma + MySQL 保持不变，仅新增 2 个只读 GET 端点
> **前端**：React 19 SPA（Vite + CSR + Puppeteer 预渲染仅 `/`）→ Next.js App Router（SSG/ISR + URL 化 i18n + 产品详情页/服务商页）

---

## 目标

从根本解决两大问题：

1. **爬虫看不到内容** — CSR SPA 的 `<div id="root">` 为空，百度几乎不渲染 JS，Google 渲染延迟高、权重低
2. **可索引页面极少** — 全站只有首页 1 个可索引 URL，长尾关键词无法覆盖，双语市场只有 1 个 zh-CN URL

同时完成所有 SEO 缺陷的全面修复（标题层级、结构化数据、社交分享、分析工具等）。

---

## 渲染策略总览

| 路由 | 渲染方式 | 说明 |
|---|---|---|
| `/` → 重定向 `/zh` | — | 根据 Accept-Language 或默认中文 |
| `/[locale]`（首页） | **SSG** + client islands | 首帧 SSG 出全部产品 HTML；筛选/排序/分页用 client component 交互 |
| `/[locale]/products/[id]` | **ISR** `revalidate: 3600` | 每小时重新生成；`generateStaticParams` 预生成所有产品页 |
| `/[locale]/providers/[name]` | **SSG** | 按服务商聚合产品 |
| `/admin/*` | **CSR** (`'use client'`) | 后台无需 SEO，纯客户端渲染，`robots: index: false` |
| `/sitemap.xml` | 动态生成 | 含首页 + 所有产品页 + 服务商页 × 2 语言 |
| `/robots.txt` | 动态生成 | Allow /, Disallow /admin/ /api/ |

---

## 目录结构

```
frontend-next/
├── next.config.ts              # output: 'standalone'，rewrites 代理 /api/
├── app/
│   ├── layout.tsx              # 根布局：metadata 默认值、字体、Organization JSON-LD
│   ├── globals.css             # 全局样式
│   ├── not-found.tsx           # 友好 404 页面
│   ├── sitemap.ts              # 动态 sitemap
│   ├── robots.ts               # 动态 robots.txt
│   ├── manifest.ts             # PWA manifest
│   ├── [locale]/
│   │   ├── layout.tsx          # i18n Provider + AntD ConfigProvider + hreflang
│   │   ├── page.tsx            # 首页：产品列表（SSG + client islands）
│   │   ├── products/
│   │   │   └── [id]/
│   │   │       └── page.tsx    # 产品详情页（ISR）
│   │   └── providers/
│   │       └── [name]/
│   │           └── page.tsx    # 服务商聚合页（SSG）
│   └── admin/                  # Admin 区（全部 "use client"）
│       ├── layout.tsx          # AdminLayout + AuthGuard + robots: noindex
│       ├── page.tsx            # redirect → /admin/products
│       ├── login/page.tsx
│       ├── products/page.tsx
│       ├── announcement/page.tsx
│       └── settings/page.tsx
├── components/                 # 复用旧前端组件（Header, FilterBar, ProductTable 等）
├── lib/
│   ├── api.ts                  # fetch 封装 + 类型定义
│   ├── i18n.ts                 # 服务端 i18n 配置
│   └── seo.ts                  # JSON-LD 生成器（Product/Offer/Breadcrumb/ItemList/Organization）
├── messages/                   # i18n 翻译资源（zh.json / en.json）
└── public/
    ├── favicon.svg
    └── og-default.png          # 1200×630 社交分享图
```

---

## 阶段 1：搭建 Next.js 项目骨架（替换 Vite + react-router）

新建 `frontend-next/`（与旧 `frontend/` 并存，迁移完成后切换）

- `npx create-next-app@latest frontend-next` —— TypeScript、App Router、CSS Modules、不使用 turbopack（兼容 AntD）
- 安装核心依赖：`antd@^6`、`@ant-design/icons`、`axios`、`i18next` + `react-i18next`、`react-markdown` + `rehype-sanitize`
- 移除不再需要的：`react-helmet-async`（Next.js 有原生 metadata）、`react-router-dom`（用 Next.js 路由）、`vite-plugin-prerender` + `puppeteer`（废弃预渲染）
- 迁移 `main.tsx` 中的 AntD ConfigProvider 主题配置到 `app/[locale]/layout.tsx`
- 配置 `next.config.ts`：
  - `output: 'standalone'`
  - `NEXT_PUBLIC_API_URL` 环境变量指向后端
  - `rewrites()` 将 `/api/*` 代理到 Express `http://backend:3000`
  - `images` 配置（如后续有产品图）

---

## 阶段 2：i18n URL 路由化（第一期硬需求，不推迟）

**核心原则**：中英文各自独立 URL，支持 hreflang，双语市场都能被索引。

- **URL 路由**：`/zh/...` 和 `/en/...`，根路径 `/` 重定向到 `/zh`（或根据 `Accept-Language` header 判断）
- **翻译文件**：复用现有 `locales/zh.json` / `en.json`，复制到 `messages/`
- **服务端 i18n**：`app/[locale]/layout.tsx` 接收 `params.locale`，初始化 i18next 实例，包裹 `I18nextProvider`
- **hreflang alternates**：每个页面 metadata 中声明
  ```ts
  alternates: {
    languages: {
      'zh-CN': `https://xmde.de/zh/...`,
      'en': `https://xmde.de/en/...`,
    },
  }
  ```
- **语言切换**：改为链接跳转 `<Link href="/en/...">` 而非 localStorage（保留 localStorage 记忆用户偏好，首次访问时用于重定向）
- **`<html lang>`**：由 `app/[locale]/layout.tsx` 根据 locale 参数设置 `zh-CN` 或 `en`

---

## 阶段 3：首页改造为 SSG + client islands（核心 SEO 修复）

**目标**：首页 HTML 中直接包含产品数据，爬虫无需执行 JS 即可抓取。

- `app/[locale]/page.tsx` 改为 **Server Component**
- 在 Server Component 中直接 `fetch` 后端 API（`/api/products` + `/api/config`），获取产品列表 + 站点配置，作为 props 传递
- 站点配置（announcement、site_title、logo、社交链接）在 Server Component 获取，**消除首页加载期的骨架屏闪烁**
- 产品数据传递给 Client Component：`ProductTable` / `ProductCard` 标记 `'use client'`，接收服务端传入的初始数据 `initialProducts`，后续筛选/分页仍走客户端 API
- 这样：**首次 HTML 已含完整产品表格 → 爬虫可见；客户端水合后保留交互能力**
- 复用 `ProductSkeleton` 仅用于客户端后续加载状态
- 移除所有 `window.__PRERENDER_INJECTED` / `HeadlessChrome` 检测的 prerender hack 代码（不再需要）

---

## 阶段 4：新增产品详情页 + 服务商聚合页（扩大可索引页面）

### 4.1 后端新增只读端点

- `GET /api/products/:id` — 返回单个产品详情（含 404 处理）
- `GET /api/products/all` — 返回所有产品 ID 列表（用于 `generateStaticParams`）
- 现有 `/api/products`、`/api/providers`、`/api/config` 保持不变

### 4.2 产品详情页 `app/[locale]/products/[id]/page.tsx`

- `generateStaticParams()`：获取所有产品 ID，生成 `[locale, id]` 参数
- `generateMetadata()`：动态 title（如 `Vultr Cloud Compute - 1GB - VPS详情 | VPS Navi`）、description、OG
- ISR：`export const revalidate = 3600`（每小时重新生成）
- 渲染产品完整规格、测评链接、下单按钮
- JSON-LD：`Product` + `Offer` + `BreadcrumbList`

### 4.3 服务商聚合页 `app/[locale]/providers/[name]/page.tsx`

- `generateStaticParams()`：获取所有服务商
- 列出该服务商的所有产品
- JSON-LD：`ItemList` + `Brand`

---

## 阶段 5：迁移 Admin 页面（纯客户端）

- 所有 admin 页面标记 `'use client'`，逻辑基本平移（JWT + localStorage 认证不变）
- 路由从 react-router 的 `<Route>` 改为 Next.js 文件路由
- `AuthGuard` 改为客户端组件，包裹 `admin/layout.tsx`
- `/admin` → `<Navigate>` 替换为 Next.js 的 `redirect('/admin/products')`
- **admin 区设置 `export const metadata = { robots: { index: false, follow: false } }` 确保不被索引**
- Admin 页面用 `dynamic(() => import(...), { ssr: false })` 懒加载，减小主 bundle

---

## 阶段 6：SEO 元数据全面修复（Next.js metadata API）

- **域名替换**：全部 `your-domain.com` → `xmde.de`，且改为从 `process.env.NEXT_PUBLIC_SITE_URL`（默认 `https://xmde.de`）读取，避免硬编码
- `app/layout.tsx` 的 metadata 导出（替代 `index.html` 静态标签 + `SEO.tsx` + `react-helmet-async`）：
  - `metadataBase`（解决相对 URL 问题）
  - `title`（含 template `'%s | VPS Navi'`）
  - `description`、`keywords`
  - `canonical`（`alternates.canonical`）
  - `openGraph`（含 `og:image` —— 新增 `og-default.png` 到 `public/`）
  - `twitter`（含 `twitter:image`）
  - `robots`
- `app/[locale]/page.tsx` 的 `generateMetadata()`：按当前语言动态生成 title/description
- 删除旧的 `SEO.tsx` 组件和 `react-helmet-async`，所有元数据由 Next.js metadata API 管理
- 新增 `public/og-default.png`（1200×630 社交分享图）—— 需准备素材或用占位图

---

## 阶段 7：结构化数据（JSON-LD）

- **WebSite schema**：移到 `app/layout.tsx`，修正 url 为 `xmde.de`。**移除 SearchAction**（站点无站内搜索，声明会误导搜索引擎）
- **新增 Organization schema**（品牌知识面板需要）
- **首页**：为产品列表生成 `ItemList` + 每个产品的 `Product` + `Offer`：
  ```json
  {
    "@type": "Product",
    "name": "Vultr Cloud Compute - 1GB",
    "brand": { "@type": "Brand", "name": "Vultr" },
    "offers": {
      "@type": "Offer",
      "price": "6.00",
      "priceCurrency": "USD",
      "url": "<affiliateUrl>"
    }
  }
  ```
  覆盖 provider/name/price/currency 等已有字段，争取 Google 价格富媒体展示
- **产品详情页**：`Product` + `Offer` + `BreadcrumbList`
- **服务商页**：`ItemList` + `Brand`
- 用 Next.js 的 `<script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(...)}} />` 在 Server Component 注入
- 统一封装到 `lib/seo.ts`：`generateProductJsonLd()`、`generateBreadcrumbJsonLd()`、`generateItemListJsonLd()`、`generateOrganizationJsonLd()`

---

## 阶段 8：标题层级 + 语义化 HTML 修复

- **Header.tsx**：站点标题 `Typography.Title level={4}` → 改为 `level={1}`（渲染为 `<h1>`），首页主标题获得正确权重
  - 注意：admin 页面的 Header 不应有 h1，需将 Header 拆分为带 h1 的公开版和普通 div 的 admin 版，或用 prop 控制
- **产品表格区域**：`<section>` 内补充 `<h2>` 标题（如"VPS 产品价格对比"），视觉上可隐藏（sr-only）但保留语义
- **产品详情页**：产品名称用 `<h1>`，规格/价格等用 `<h2>`
- **补 `<footer>`**：首页增加页脚（版权信息、社交链接重复、隐私政策链接），完善语义结构
- **公告区**：`<aside>` 保持，内容用适当标题
- **所有 `<img>`** 加 `width`/`height` 属性防 CLS

---

## 阶段 9：动态 sitemap.xml + robots.txt

- `app/sitemap.ts`：从后端拉取产品列表，动态生成 sitemap：
  - 首页 URL × 2 语言（priority 1.0）
  - 所有产品详情页 × 2 语言（priority 0.8）
  - 所有服务商页 × 2 语言（priority 0.6）
  - 每条 URL 带 `<lastmod>`（取产品 `updatedAt` 最大值）
- `app/robots.ts`：动态生成 robots.txt
  - `Sitemap: https://xmde.de/sitemap.xml`
  - `Disallow /admin/`、`/api/`
- 删除旧的 `public/sitemap.xml`、`public/robots.txt` 静态文件

---

## 阶段 10：性能与 JS 分割

- Next.js 自动按路由代码分割，单 bundle 问题自动解决
- AntD 组件按需引入（AntD v6 默认支持 tree-shaking）
- Admin 页面用 `dynamic import` 懒加载，不进入首页 bundle
- `react-markdown` 仅在 admin 公告编辑页使用，懒加载
- 字体策略：迁移到 `next/font`（内置优化、消除 CLS、自动 self-host）
  - Inter + Noto Sans SC
- AntD + Next.js App Router SSR 样式：配置 `@ant-design/cssinjs` 的 `StyleRegistry`，避免 FOUC
- 首页产品图片优化：当前无产品图，logo 加 `width`/`height` 属性防 CLS

---

## 阶段 11：404 页面 + Nginx 配置

- `app/not-found.tsx`：友好的 404 页面（含返回首页链接、语义化结构）
- Next.js 自带 404 处理，无需 nginx `error_page` hack
- Nginx 配置更新（`docker/nginx/default.conf`）：
  - 改为反代到 Next.js server（`proxy_pass http://frontend:3000`）而非静态托管
  - 或前端容器直接暴露 3000 端口、nginx 仅做 TLS/反代
  - 移除 `try_files $uri $uri/ /index.html`（不再需要 SPA fallback）
- 后续增加 HTTP→HTTPS 重定向（需配置 TLS 证书，1Panel/OpenResty 已处理）

---

## 阶段 12：Docker 与部署链路更新

- `docker/frontend/Dockerfile` 重写：
  - 基于 Next.js official standalone 构建（`output: 'standalone'`）
  - 移除 Chromium/Puppeteer 安装（不再需要预渲染）
  - 镜像体积大幅减小
- `docker-compose.yml`：前端服务端口/健康检查适配 Next.js（3000 端口）
- `.env.example`：新增 `NEXT_PUBLIC_SITE_URL`、`NEXT_PUBLIC_API_URL`
- 后端服务（`backend`）配置不变
- 旧 `frontend/` 目录保留至验证完成，验证后删除或归档
- 更新 `docs/deployment.md` 反映新的构建/运行方式
- `scripts/update-from-github.sh` 适配新目录结构

---

## 阶段 13：分析工具集成 + 验证

- 集成 **Google Search Console** 验证（meta 标签或 DNS，通过环境变量注入 `NEXT_PUBLIC_GSC_VERIFICATION`）
- 集成 **Google Analytics 4**（via `@next/third-parties/google` 或 `next/script`）
- 验证清单：
  - `curl https://xmde.de/zh` 检查 HTML 中是否包含产品名称/价格（无 JS 执行）
  - `curl https://xmde.de/en` 检查英文版 HTML
  - Google Rich Results Test 验证 JSON-LD（Product/Offer/ItemList/Organization）
  - Lighthouse SEO 审计 ≥ 95
  - 移动端友好性测试
  - `sitemap.xml` / `robots.txt` 可访问，包含所有产品 URL
  - 社交分享预览（og:image 生效）
  - hreflang 标签正确（`<link rel="alternate" hreflang="zh-CN" ...>` 和 `hreflang="en" ...>`）
  - 产品详情页 `/zh/products/[id]` 可访问且 HTML 含产品数据
  - 服务商页 `/zh/providers/[name]` 可访问
  - admin 后台 CRUD 功能正常
  - Docker 容器构建/启动正常

---

## 预期收益

| 指标 | 现状 | 目标 |
|---|---|---|
| 爬虫首屏可见内容 | ❌ 空 root | ✅ 完整产品表格 |
| 可索引页面数 | ❌ 仅首页 1 个 | ✅ 首页 + 产品详情页 + 服务商页 × 2 语言 |
| i18n 可索引性 | ❌ 1 个 zh-CN URL | ✅ /zh/ + /en/ 独立 URL + hreflang |
| Core Web Vitals（FCP/LCP） | ⚠️ ~400KB JS 阻塞 | ✅ 路由级分割 |
| 标题层级 | ❌ 无 h1 | ✅ 规范 h1→h2→h3 |
| JSON-LD 富媒体 | ❌ 仅 WebSite | ✅ Product/Offer/ItemList/Organization/Breadcrumb |
| 社交分享预览 | ❌ 无 og:image | ✅ 大图卡 |
| 可索引性 | ❌ 仅依赖 Googlebot 执行 JS | ✅ 全爬虫友好（百度也能抓取） |
| 长尾关键词覆盖 | ❌ 几乎为零 | ✅ 产品名 + 服务商名 + 规格组合 |
| SEO 监控 | ❌ 无 | ✅ GSC + GA4 |

---

## 执行顺序

```
阶段 1（骨架）
  → 阶段 2（i18n URL 路由化）
  → 阶段 3（首页 SSG + client islands）
  → 阶段 4（产品详情页 + 服务商页 + 后端端点）
  → 阶段 5（Admin 迁移）
  → 阶段 6-9（SEO 修复：metadata / JSON-LD / 标题层级 / sitemap，可并行）
  → 阶段 10（性能优化）
  → 阶段 11-12（404 / Nginx / Docker 部署）
  → 阶段 13（分析工具 + 验证）
```

---

## 关键迁移映射表

| 现有 | Next.js | 说明 |
|---|---|---|
| `react-router-dom` `<BrowserRouter>` | App Router 文件路由 | 不再需要路由库 |
| `react-helmet-async` `<SEO>` | `generateMetadata()` / `metadata` | 内置 Metadata API |
| `vite-plugin-prerender` | SSG/ISR（内置） | 不再需要 Puppeteer |
| `i18n.ts`（localStorage） | `app/[locale]/` 路由参数 | URL 化 i18n + hreflang |
| `axios` 实例 + `/api` baseURL | `fetch` + Next.js rewrites | 或保留 axios |
| `main.tsx` ConfigProvider | `app/[locale]/layout.tsx` | AntD 主题 |
| `index.html` 静态 meta | `app/layout.tsx` metadata | 动态 metadata |
| `public/robots.txt` | `app/robots.ts` | 动态生成 |
| `public/sitemap.xml` | `app/sitemap.ts` | 动态生成 |
| `Header.tsx` `Title level={4}` | `Title level={1}` | h1 标题权重 |
| 无产品详情页 | `/[locale]/products/[id]` | ISR + Product JSON-LD |
| 无服务商页 | `/[locale]/providers/[name]` | SSG + ItemList JSON-LD |

---

## 风险与注意事项

1. **AntD 6 + Next.js App Router 兼容性**：AntD 6 对 RSC 支持较好，但部分组件需 `'use client'`。`@ant-design/cssinjs` 需配置 SSR 样式注入，避免 FOUC。
2. **i18n 迁移**：现有 localStorage 切换 → URL 路由，需处理旧 URL 重定向（`/` → `/zh`）。
3. **Admin 后台**：可考虑是否拆分为独立 SPA（保持 Vite），避免 Next.js 中大量 `'use client'`。但同框架更简单，建议先同框架迁移。
4. **并行开发**：在 `frontend-next/` 平行开发，完成验证后替换 `frontend/`，降低风险。
5. **后端改动最小**：仅新增 2 个只读 GET 端点，不影响现有功能。
6. **og:image 素材**：需准备 1200×630 社交分享图，可先用占位图。

---

## 不在本次范围内

- 内容管理系统（评测文章、博客等）— 可作为后续扩展
- 图片上传/优化 — 当前产品无图片
- 站内搜索功能 — 当前筛选已够用
- CDN 配置 — 1Panel/OpenResty 层面处理
