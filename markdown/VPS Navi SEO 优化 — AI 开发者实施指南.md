# VPS Navi SEO 优化 — AI 开发者实施指南

本文档为 AI 开发者提供全部 8 个 SEO 优化方案的精确实施指令。每个方案包含：要修改的文件、完整代码 diff、边界说明（不应修改的内容）、以及测试验证步骤。

> [!IMPORTANT]
> **实施顺序**：严格按方案 1→8 的顺序执行。方案 6 依赖安装新 npm 包，方案 8 依赖方案 6 的 `HelmetProvider`。
>
> **域名占位符**：代码中所有 `https://your-domain.com` 均为占位符，**保持原样不要替换**，用户部署时自行修改。

---

## 前置准备：安装依赖

在开始方案 6 之前，必须先安装依赖。建议在开头统一执行：

```bash
cd d:\opencode\vps_aff_site\frontend
npm install react-helmet-async
```

方案 8 需要的插件：

```bash
cd d:\opencode\vps_aff_site\frontend
npm install -D vite-plugin-prerender puppeteer
```

> [!CAUTION]
> `puppeteer` 是 `vite-plugin-prerender` 的 peer dependency。如果安装后 `npm run build` 报 puppeteer 相关错误，尝试 `npx puppeteer browsers install chrome`。

---

## 方案 1：基础 Meta 标签 & HTML lang 修复

### 修改文件

#### [MODIFY] [index.html](file:///d:/opencode/vps_aff_site/frontend/index.html)

将整个文件替换为以下内容（17 行 → 30 行）：

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="description" content="VPS导航 - 全球VPS服务器价格对比与推荐，帮你找到最具性价比的VPS主机" />
    <meta name="keywords" content="VPS, 服务器, 虚拟主机, VPS对比, 云服务器, 低价VPS, VPS推荐" />
    <link rel="canonical" href="https://your-domain.com/" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&display=swap" rel="stylesheet">
    <title>VPS导航 - 全球VPS价格对比与推荐 | VPS Navi</title>
    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="VPS导航 - 全球VPS价格对比与推荐" />
    <meta property="og:description" content="实时对比全球VPS服务器价格，帮你找到最具性价比的VPS主机" />
    <meta property="og:url" content="https://your-domain.com/" />
    <meta property="og:locale" content="zh_CN" />
    <meta property="og:site_name" content="VPS Navi" />
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="VPS导航 - 全球VPS价格对比与推荐" />
    <meta name="twitter:description" content="实时对比全球VPS服务器价格，帮你找到最具性价比的VPS主机" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 关键变更说明

| 变更 | 原值 | 新值 |
|---|---|---|
| `<html lang>` | [en](file:///d:/opencode/vps_aff_site/frontend/src/pages/Home/ProductTable.tsx#63-66) | `zh-CN` |
| `<title>` | `VPS Navi` | `VPS导航 - 全球VPS价格对比与推荐 \| VPS Navi` |
| Meta description | ❌ 不存在 | ✅ 添加 |
| Meta keywords | ❌ 不存在 | ✅ 添加 |
| Canonical URL | ❌ 不存在 | ✅ 添加 |
| Open Graph | ❌ 不存在 | ✅ 添加 6 个 og 标签 |
| Twitter Card | ❌ 不存在 | ✅ 添加 3 个 twitter 标签 |

### 边界：不要修改

- `<link rel="preconnect">` 和字体加载部分保持不变（方案 5 单独处理）
- `<script>` 标签保持不变
- `<div id="root">` 保持不变

---

## 方案 2：添加 robots.txt 和 sitemap.xml

### 新建文件

#### [NEW] [robots.txt](file:///d:/opencode/vps_aff_site/frontend/public/robots.txt)

```txt
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://your-domain.com/sitemap.xml
```

#### [NEW] [sitemap.xml](file:///d:/opencode/vps_aff_site/frontend/public/sitemap.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://your-domain.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

### 边界：不要修改

- `public/` 目录下已有的 [favicon.svg](file:///d:/opencode/vps_aff_site/frontend/public/favicon.svg) 和 [icons.svg](file:///d:/opencode/vps_aff_site/frontend/public/icons.svg) 不要动
- 这两个新文件是纯静态文件，不需要修改 [vite.config.ts](file:///d:/opencode/vps_aff_site/frontend/vite.config.ts) 或任何 JS/TS 文件

---

## 方案 3：语义化 HTML 重构

### 修改文件

#### [MODIFY] [Home/index.tsx](file:///d:/opencode/vps_aff_site/frontend/src/pages/Home/index.tsx)

**变更 1** — 将最外层 `<div>` 替换为 `<main>`（第 164 行，第 224 行）：

```diff
- <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
+ <main style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
```

```diff
- </div>
+ </main>
```

> [!WARNING]
> 仅修改最外层的 `<div>`（第 164 行的开标签和第 224 行的闭标签），不要修改内部的任何 `<div>`。

**变更 2** — 将产品列表容器 `<div>` 替换为 `<section>`（第 202 行，第 223 行）：

```diff
- <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1, padding: isSmallScreen ? '0 12px' : '0 24px' }}>
+ <section aria-label="VPS Products" style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1, padding: isSmallScreen ? '0 12px' : '0 24px' }}>
```

```diff
- </div>
+ </section>
```

#### [MODIFY] [Header.tsx](file:///d:/opencode/vps_aff_site/frontend/src/components/Header.tsx)

**变更 1** — Logo `alt` 属性（第 37 行）：

```diff
- <img src={config.site_logo} alt="Logo" className={styles.logo} />
+ <img src={config.site_logo} alt="VPS Navi Logo" className={styles.logo} />
```

**变更 2** — 社交链接容器添加 `<nav>`（第 43 行）：

```diff
- <Space className={styles.socialIcons}>
+ <nav aria-label="Social links"><Space className={styles.socialIcons}>
```

对应的闭标签（第 64 行）：

```diff
- </Space>
+ </Space></nav>
```

#### [MODIFY] [Announcement.tsx](file:///d:/opencode/vps_aff_site/frontend/src/components/Announcement.tsx)

将外层 `<div>` 改为 `<aside>`（第 26 行，第 48 行）：

```diff
- <div className={styles.container}>
+ <aside className={styles.container} aria-label="Announcement">
```

```diff
- </div>
+ </aside>
```

### 边界：不要修改

- 不要修改 [FilterBar.tsx](file:///d:/opencode/vps_aff_site/frontend/src/components/FilterBar.tsx)、[ProductTable.tsx](file:///d:/opencode/vps_aff_site/frontend/src/pages/Home/ProductTable.tsx)、[ProductCard.tsx](file:///d:/opencode/vps_aff_site/frontend/src/pages/Home/ProductCard.tsx) 的结构
- 不要修改任何 CSS 模块文件
- 不要修改 [App.tsx](file:///d:/opencode/vps_aff_site/frontend/src/App.tsx) 的路由结构
- `<header>` 标签在 [Header.tsx](file:///d:/opencode/vps_aff_site/frontend/src/components/Header.tsx) 中已经在使用，无需改动

---

## 方案 4：动态 HTML lang 同步 i18n

### 修改文件

#### [MODIFY] [i18n.ts](file:///d:/opencode/vps_aff_site/frontend/src/i18n.ts)

在文件末尾 `export default i18n;` **之前**，添加以下代码：

```diff
+ // 语言代码到 HTML lang 属性的映射
+ const langMap: Record<string, string> = { zh: 'zh-CN', en: 'en' };
+
+ // 初始化时同步 HTML lang 属性
+ document.documentElement.lang = langMap[i18n.language] || 'zh-CN';
+
+ // 语言切换时同步 HTML lang 属性
+ i18n.on('languageChanged', (lng: string) => {
+   document.documentElement.lang = langMap[lng] || 'zh-CN';
+ });
+
  export default i18n;
```

完整文件应为：

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zh from './locales/zh.json';
import en from './locales/en.json';

// 从 localStorage 读取用户语言偏好
const savedLang = localStorage.getItem('lang') || 'zh';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      zh: { translation: zh },
      en: { translation: en },
    },
    lng: savedLang,
    fallbackLng: 'zh',
    interpolation: {
      escapeValue: false, // React 已经处理了 XSS 防护
    },
  });

// 语言代码到 HTML lang 属性的映射
const langMap: Record<string, string> = { zh: 'zh-CN', en: 'en' };

// 初始化时同步 HTML lang 属性
document.documentElement.lang = langMap[i18n.language] || 'zh-CN';

// 语言切换时同步 HTML lang 属性
i18n.on('languageChanged', (lng: string) => {
  document.documentElement.lang = langMap[lng] || 'zh-CN';
});

export default i18n;
```

### 边界：不要修改

- 不要修改 `i18n.init()` 的配置参数
- 不要修改 [Header.tsx](file:///d:/opencode/vps_aff_site/frontend/src/components/Header.tsx) 中 [toggleLanguage](file:///d:/opencode/vps_aff_site/frontend/src/components/Header.tsx#23-28) 函数的逻辑
- 不要修改 `savedLang` 和 `fallbackLng` 的值

---

## 方案 5：字体加载性能优化

### 修改文件

#### [MODIFY] [index.html](file:///d:/opencode/vps_aff_site/frontend/index.html)

> [!NOTE]
> 这个改动叠加在方案 1 的 [index.html](file:///d:/opencode/vps_aff_site/frontend/index.html) 修改之上。

将字体加载那行（方案 1 后文件的第 12 行）：

```diff
- <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&display=swap" rel="stylesheet">
+ <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
+ <noscript><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&display=swap" rel="stylesheet"></noscript>
```

### 原理

- `media="print"` 使浏览器异步加载字体 CSS，不阻塞页面渲染
- `onload="this.media='all'"` 加载完成后切换为应用到所有媒体
- `<noscript>` 为禁用 JS 的用户提供回退

### 边界：不要修改

- `<link rel="preconnect">` 那两行保持不变（它们对字体加载加速有帮助）
- 只修改字体 CSS 的 `<link>` 标签，不要修改其他标签

---

## 方案 6：添加 react-helmet-async 动态 Head 管理

### 依赖

```bash
npm install react-helmet-async
```

### 新建文件

#### [NEW] [SEO.tsx](file:///d:/opencode/vps_aff_site/frontend/src/components/SEO.tsx)

```tsx
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  lang?: string;
}

const defaultTitle = 'VPS导航 - 全球VPS价格对比与推荐 | VPS Navi';
const defaultDescription = 'VPS导航 - 全球VPS服务器价格对比与推荐，帮你找到最具性价比的VPS主机';

const SEO: React.FC<SEOProps> = ({ title, description, lang = 'zh-CN' }) => {
  const finalTitle = title ? `${title} | VPS Navi` : defaultTitle;
  const finalDescription = description || defaultDescription;

  return (
    <Helmet>
      <html lang={lang} />
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
    </Helmet>
  );
};

export default SEO;
```

### 修改文件

#### [MODIFY] [main.tsx](file:///d:/opencode/vps_aff_site/frontend/src/main.tsx)

**变更 1** — 添加 import（第 1 行后）：

```diff
  import { StrictMode } from 'react'
  import { createRoot } from 'react-dom/client'
  import { ConfigProvider } from 'antd'
+ import { HelmetProvider } from 'react-helmet-async'
  import './index.css'
  import './i18n'
  import App from './App.tsx'
```

**变更 2** — 用 `<HelmetProvider>` 包裹 `<App />`：

```diff
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
-     <ConfigProvider
+     <HelmetProvider>
+       <ConfigProvider
          theme={{
            ...
          }}
        >
          <App />
-     </ConfigProvider>
+       </ConfigProvider>
+     </HelmetProvider>
    </StrictMode>,
  )
```

完整的 [main.tsx](file:///d:/opencode/vps_aff_site/frontend/src/main.tsx) 文件（修改后）：

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import './i18n'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#6366f1',
            fontFamily: "'Inter', 'Noto Sans SC', system-ui, -apple-system, sans-serif",
            borderRadius: 12,
            colorSuccess: '#10b981',
            colorWarning: '#f59e0b',
            colorError: '#ef4444',
            colorInfo: '#3b82f6',
            colorBgContainer: '#ffffff',
            colorBgLayout: '#f8fafc',
            controlHeight: 40,
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          },
          components: {
            Button: {
              controlHeight: 42,
              paddingInline: 20,
              borderRadius: 10,
              fontWeight: 600,
            },
            Table: {
              headerBg: 'transparent',
              headerColor: '#1e293b',
              headerBorderRadius: 12,
              rowHoverBg: 'rgba(99, 102, 241, 0.05)',
            },
            Card: {
              borderRadiusLG: 16,
              boxShadowTertiary: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            },
            Input: {
              controlHeight: 42,
              borderRadius: 10,
            },
            Select: {
              controlHeight: 42,
              borderRadius: 10,
            }
          }
        }}
      >
        <App />
      </ConfigProvider>
    </HelmetProvider>
  </StrictMode>,
)
```

#### [MODIFY] [Home/index.tsx](file:///d:/opencode/vps_aff_site/frontend/src/pages/Home/index.tsx)

**变更 1** — 添加 import（在现有 import 区域内）：

```diff
  import { useTranslation } from 'react-i18next';
  ...existing imports...
+ import SEO from '../../components/SEO';
```

**变更 2** — 在 [Home](file:///d:/opencode/vps_aff_site/frontend/src/pages/Home/index.tsx#33-227) 组件中使用 `useTranslation` 并添加 `<SEO>` 组件：

在组件顶部（第 34 行之后）添加：

```diff
  const Home: React.FC = () => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
+   const { i18n } = useTranslation();
    const [config, setConfig] = useState<FrontendConfig | null>(null);
```

在 `return` 的 `<main>` 标签下方第一行添加（方案 3 改为 `<main>` 后）：

```diff
  return (
    <main style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
+     <SEO
+       title={i18n.language === 'zh' ? 'VPS导航 - 全球VPS价格对比与推荐' : 'VPS Navigator - Global VPS Price Comparison'}
+       description={i18n.language === 'zh' ? '实时对比全球VPS服务器价格，帮你找到最具性价比的VPS主机' : 'Compare VPS server prices worldwide and find the best deals'}
+       lang={i18n.language === 'zh' ? 'zh-CN' : 'en'}
+     />
      {/* Dynamic Background */}
```

需要添加 import（如果 [Home/index.tsx](file:///d:/opencode/vps_aff_site/frontend/src/pages/Home/index.tsx) 还没有 `useTranslation`）：

```diff
+ import { useTranslation } from 'react-i18next';
```

### 边界：不要修改

- 不要修改 `ConfigProvider` 的 `theme` 对象
- 不要修改 [App.tsx](file:///d:/opencode/vps_aff_site/frontend/src/App.tsx) 的路由定义
- 不要在 Admin 页面（`Login.tsx`, `AdminLayout.tsx` 等）中添加 `<SEO>` 组件，Admin 页不需要 SEO
- `<HelmetProvider>` 必须在 `<ConfigProvider>` 的外层

---

## 方案 7：添加结构化数据 (JSON-LD)

### 修改文件

#### [MODIFY] [index.html](file:///d:/opencode/vps_aff_site/frontend/index.html)

在 `</head>` 标签的上方插入以下结构化数据脚本：

```diff
    <meta name="twitter:description" content="实时对比全球VPS服务器价格，帮你找到最具性价比的VPS主机" />
+   <!-- Structured Data -->
+   <script type="application/ld+json">
+   {
+     "@context": "https://schema.org",
+     "@type": "WebSite",
+     "name": "VPS导航 - VPS Navi",
+     "url": "https://your-domain.com",
+     "description": "全球VPS服务器价格对比与推荐平台",
+     "inLanguage": ["zh-CN", "en"],
+     "potentialAction": {
+       "@type": "SearchAction",
+       "target": "https://your-domain.com/?keyword={search_term_string}",
+       "query-input": "required name=search_term_string"
+     }
+   }
+   </script>
  </head>
```

### 边界：不要修改

- JSON-LD 中的 `target` 使用 `keyword` 查询参数与 [FilterBar](file:///d:/opencode/vps_aff_site/frontend/src/components/FilterBar.tsx#20-198) 组件的 `keyword` 筛选字段对应
- 不要添加 [Product](file:///d:/opencode/vps_aff_site/frontend/src/api/index.ts#102-121) 类型的 JSON-LD（产品数据是动态的，在 SPA 中硬编码没有意义）
- 结构化数据放在 [index.html](file:///d:/opencode/vps_aff_site/frontend/index.html) 中而非 Helmet 中，因为是全站级别的静态数据

---

## 方案 8：SPA 预渲染

### 依赖

```bash
npm install -D vite-plugin-prerender puppeteer
```

### 修改文件

#### [MODIFY] [vite.config.ts](file:///d:/opencode/vps_aff_site/frontend/vite.config.ts)

替换整个文件内容为：

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { PuppeteerRenderer, prerender } from 'vite-plugin-prerender'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    prerender({
      staticDir: path.join(__dirname, 'dist'),
      routes: ['/'],
      renderer: new PuppeteerRenderer({
        renderAfterTime: 3000,
      }),
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

### 关键配置说明

| 配置项 | 值 | 说明 |
|---|---|---|
| `staticDir` | `path.join(__dirname, 'dist')` | Vite 默认输出目录 |
| `routes` | `['/']` | 仅预渲染首页，Admin 页不需要 |
| `renderAfterTime` | `3000` | 等待 3 秒让 API 数据加载完成后再输出 HTML |

### 边界：不要修改

- `server.proxy` 配置保持不变
- 仅预渲染 `/` 路由，**不要**添加 `/admin`、`/admin/login` 等管理后台路由
- 预渲染仅在 `npm run build` 时生效，不影响 `npm run dev` 的开发体验

> [!WARNING]
> 预渲染需要在构建时能访问后端 API。如果构建环境没有运行后端服务，预渲染的页面将只包含空的产品列表（骨架屏），但 meta 标签和结构化数据仍会存在。这是可以接受的，因为搜索引擎主要关注 meta 信息。

---

## 方案 1-8 修改后的 index.html 完整最终版

以下是经过方案 1、5、7 修改后的 [index.html](file:///d:/opencode/vps_aff_site/frontend/index.html) 最终完整版本：

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="description" content="VPS导航 - 全球VPS服务器价格对比与推荐，帮你找到最具性价比的VPS主机" />
    <meta name="keywords" content="VPS, 服务器, 虚拟主机, VPS对比, 云服务器, 低价VPS, VPS推荐" />
    <link rel="canonical" href="https://your-domain.com/" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
    <noscript><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&display=swap" rel="stylesheet"></noscript>
    <title>VPS导航 - 全球VPS价格对比与推荐 | VPS Navi</title>
    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="VPS导航 - 全球VPS价格对比与推荐" />
    <meta property="og:description" content="实时对比全球VPS服务器价格，帮你找到最具性价比的VPS主机" />
    <meta property="og:url" content="https://your-domain.com/" />
    <meta property="og:locale" content="zh_CN" />
    <meta property="og:site_name" content="VPS Navi" />
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="VPS导航 - 全球VPS价格对比与推荐" />
    <meta name="twitter:description" content="实时对比全球VPS服务器价格，帮你找到最具性价比的VPS主机" />
    <!-- Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "VPS导航 - VPS Navi",
      "url": "https://your-domain.com",
      "description": "全球VPS服务器价格对比与推荐平台",
      "inLanguage": ["zh-CN", "en"],
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://your-domain.com/?keyword={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## 文件变更总结

| 文件 | 操作 | 涉及方案 |
|---|---|---|
| [frontend/index.html](file:///d:/opencode/vps_aff_site/frontend/index.html) | MODIFY | 1, 5, 7 |
| `frontend/public/robots.txt` | NEW | 2 |
| `frontend/public/sitemap.xml` | NEW | 2 |
| [frontend/src/pages/Home/index.tsx](file:///d:/opencode/vps_aff_site/frontend/src/pages/Home/index.tsx) | MODIFY | 3, 6 |
| [frontend/src/components/Header.tsx](file:///d:/opencode/vps_aff_site/frontend/src/components/Header.tsx) | MODIFY | 3 |
| [frontend/src/components/Announcement.tsx](file:///d:/opencode/vps_aff_site/frontend/src/components/Announcement.tsx) | MODIFY | 3 |
| [frontend/src/i18n.ts](file:///d:/opencode/vps_aff_site/frontend/src/i18n.ts) | MODIFY | 4 |
| `frontend/src/components/SEO.tsx` | NEW | 6 |
| [frontend/src/main.tsx](file:///d:/opencode/vps_aff_site/frontend/src/main.tsx) | MODIFY | 6 |
| [frontend/vite.config.ts](file:///d:/opencode/vps_aff_site/frontend/vite.config.ts) | MODIFY | 8 |

---

## 验证计划

### 测试 1：TypeScript 编译检查

确保所有修改不引入类型错误：

```bash
cd d:\opencode\vps_aff_site\frontend
npx tsc --noEmit
```

**预期结果**：无错误输出。

### 测试 2：Vite 构建检查

确保项目能正常构建：

```bash
cd d:\opencode\vps_aff_site\frontend
npm run build
```

**预期结果**：构建成功，无错误。`dist/` 目录生成正常。

### 测试 3：静态文件验证

构建后检查生成的文件：

```bash
# 检查 robots.txt 是否被拷贝到 dist
cat d:\opencode\vps_aff_site\frontend\dist\robots.txt

# 检查 sitemap.xml 是否被拷贝到 dist
cat d:\opencode\vps_aff_site\frontend\dist\sitemap.xml
```

**预期结果**：两个文件内容与 `public/` 下的源文件一致。

### 测试 4：index.html 内容验证

```bash
# 检查构建后的 index.html 包含所有 SEO 标签
$html = Get-Content d:\opencode\vps_aff_site\frontend\dist\index.html -Raw
if ($html -match 'lang="zh-CN"') { "✅ lang=zh-CN" } else { "❌ lang missing" }
if ($html -match 'meta name="description"') { "✅ meta description" } else { "❌ meta description missing" }
if ($html -match 'og:title') { "✅ og:title" } else { "❌ og:title missing" }
if ($html -match 'twitter:card') { "✅ twitter:card" } else { "❌ twitter:card missing" }
if ($html -match 'application/ld\+json') { "✅ JSON-LD" } else { "❌ JSON-LD missing" }
if ($html -match 'media="print"') { "✅ async font" } else { "❌ async font missing" }
if ($html -match 'rel="canonical"') { "✅ canonical" } else { "❌ canonical missing" }
```

**预期结果**：全部 ✅。

### 测试 5：浏览器运行测试

启动开发服务器并在浏览器中验证：

```bash
cd d:\opencode\vps_aff_site\frontend
npm run dev
```

在浏览器中打开 `http://localhost:5173/`，执行以下检查：

1. **页面加载正常**：首页正常显示，无白屏或 JS 错误
2. **Console 无报错**：打开 DevTools → Console，无红色错误
3. **`<html lang>` 属性**：DevTools → Elements → 检查 `<html>` 标签的 `lang` 属性应为 `zh-CN`
4. **语言切换**：点击右上角语言切换按钮，`<html lang>` 应动态变为 [en](file:///d:/opencode/vps_aff_site/frontend/src/pages/Home/ProductTable.tsx#63-66)，再点回来变为 `zh-CN`
5. **`<title>` 标签**：浏览器标签页标题应显示 `VPS导航 - 全球VPS价格对比与推荐 | VPS Navi`
6. **语义化结构**：Elements 中应能看到 `<main>`, `<section aria-label="VPS Products">`, `<nav aria-label="Social links">`, `<aside>` 等标签
7. **Admin 页面正常**：访问 `/admin/login`，登录页正常显示，无报错

### 测试 6：Lighthouse SEO 审计

在 Chrome DevTools 中：

1. 打开 `http://localhost:5173/`
2. DevTools → Lighthouse → 勾选 "SEO" → Generate report
3. 检查 SEO 评分

**预期结果**：SEO 评分应 ≥ 90 分。

> [!NOTE]
> 预渲染效果只能在 `npm run build` + `npm run preview` 模式下验证，`npm run dev` 时不会触发预渲染。
