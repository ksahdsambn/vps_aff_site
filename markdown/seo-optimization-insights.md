# VPS Navi SEO 优化代码洞察 (SEO Optimization Insights)

本文档记录了在本次全局 SEO 优化中，新增与修改的核心前端代码的设计思路与代码逻辑洞察。本次优化主要围绕技术 SEO、内容语义化以及抓取性能优化展开。

## 1. 核心构建与静态资源配置的洞察

### `vite.config.ts` (SPA 预渲染配置)
* **核心洞察**: 单页应用 (SPA) 对基础爬虫非常不友好（尤其是无法执行 JS 的爬虫）。为解决此问题，我们引入了 `vite-plugin-prerender`。
* **技术细节**: 
  * 启用了针对根路径 `/` 的静态预渲染。借助于 Puppeteer，将 Vite 构建好的应用抛入无头浏览器执行。
  * `renderAfterTime: 3000` 表明等待组件挂载及 API 返回（如获取数据和配置）3 秒后，再将渲染完毕的 DOM 保存成为 `index.html`。
  * **ESM 兼容性处理**: Vite 默认使用 `type="module"`，但是 `vite-plugin-prerender` 原生存在对 ESM 环境 `require()` 调用的错误。因此我们通过 Node 的 `module.createRequire` 显式加载该库的 CJS 入口并成功绕过兼容性限制。这样的解决方案具备很高的健壮性和适用性。

### `public/robots.txt` & `public/sitemap.xml`
* **核心洞察**: 指引搜索引擎有效且受控地抓取站点。
* **文件含义**:
  * `robots.txt` 开放了全站抓取，但屏蔽了无需被搜索到的 `/admin/` 和后端的 `/api/` 路径，节省爬虫抓取配额 (Crawl Budget)。
  * `sitemap.xml` 声明了首页，并指定了抓取优先级 (`1.0`) 以及日常更新频率 (`daily`)，为搜索引擎提供主动探寻的线索。

## 2. 根入口结构与基础语义化配置

### `index.html` (基础 Meta 结构优化 & 结构化数据)
* **核心洞察**: 页面核心元信息是 SEO 排名及社交分享预览的根基。
* **代码修改点**:
  * 初始化 `lang="zh-CN"`。
  * 补全 `description`, `keywords`，以及带有 Canonical 声明的唯一主链。
  * 加入 **Open Graph (og)** 和 **Twitter Card** 大量标签以确保该站点在被分享至社交媒体时能被解析成丰富的摘要及图片卡片。
  * 引入了 **JSON-LD 结构化数据** (`@type": "WebSite"`，声明多语言及 `SearchAction`)，使 Google 可以理解站内搜索入口与站点的自然属性。
  * 字体文件的加载使用 `media="print" onload="this.media='all'"` 模式，这使得阻塞渲染 (Render-Blocking) 资源变为异步请求，加快 **FCP (First Contentful Paint)**，同时提供 `<noscript>` 回退，增强兼容与抓取稳定性。

### `src/i18n.ts` (动态 lang 同步)
* **核心洞察**: 搜索引擎和辅助技术（如屏幕阅读器）高度依赖 `<html>` 的 `lang` 属性判断内容语种。
* **实施细节**: 在初始化和 `languageChanged` 事件中，动态根据当前的 i18next 状态更新 `document.documentElement.lang` (在 `en` 与 `zh-CN` 之间切换)。这是在单页切换语言时维护全生命周期多语言正确性的关键动作。

## 3. React DOM 与语义标签重构

### `src/pages/Home/index.tsx`
* **核心洞察**: `div` 汤对 SEO 分析模型缺乏特征，引入 HTML5 语义化标签能大幅提升内容区识别度。
* **重构动作**:
  * 将页面的根级结构包裹 `div` 替换为了 `<main>` 标志主要内容区。
  * 将产品卡片、表格区域从 `div` 替换为 `<section aria-label="VPS Products">`，向无障碍设备及爬虫明确内容块意图。
  * 结合 React Helmet 添加动态多语言 TDK（Title, Description 等信息）。

### `src/components/Header.tsx` & `src/components/Announcement.tsx`
* **组件级语义处理**:
  * 头部中的 Logo 原 `alt="Logo"` 修改为 `alt="VPS Navi Logo"`，注入关键字上下文。
  * 相关社交链接套用 `<nav aria-label="Social links">`，强化外部引流与社交图谱权重关联。
  * 页面顶部的通知栏容器自 `div` 改为了 `<aside aria-label="Announcement">`。因为它属于补充性质或短暂性质信息，作为外挂旁白 (aside) 更符合标准。

## 4. 动态元信息与生命周期

### `src/components/SEO.tsx` & `src/main.tsx`
* **核心洞察**: 由于是基于 React 的 SPA 站点，静态的 `index.html` 提供基础结构，但组件加载后需能根据路由、状态和所选语言动态控制 `<title>` 和 `<meta>`。
* **方案设计**:
  * **`SEO.tsx`**: 封装了一个专用的 SEO 容器组件。内部通过 `Helmet` (由 `react-helmet-async` 提供) 进行 DOM 侧和服务器侧安全的 Head 管理。当它渲染时，会将外部传入的 `title` 和 `description` 直接打入 `<head>`，并动态修正 `og:title/description` 及 `twitter:title/description`。
  * **`main.tsx`**: 在根部注入了 `<HelmetProvider>`，使其能统一管理嵌套树并安全捕获 React V18 严格模式下的并发渲染，这同样是后续深入可扩展 SSR 的前置组件基础。

---
**总结**: 
通过以上 8 个连续步骤的重构设计，`vps_aff_site` 已从原先一个重客户端的、纯数据驱动界面的 SPA，升级成为了一个具备丰富“可搜索属性”、“高性能渲染管道 (SSG) ”及“国际化 SEO 合规”的成熟前端工程。
