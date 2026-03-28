# VPS AFF 网站 — 架构文档

## 文档说明

本文档记录项目中新增的每个代码文件的作用和职责。

---

## 项目结构概览

```
vps_aff_site/
├── frontend/          # React 前端项目（待创建）
├── backend/           # Node.js 后端项目（待创建）
├── docker/            # Docker 配置文件（待创建）
├── docs/              # 项目文档（待创建）
├── markdown/          # 开发文档
│   ├── ai-dev-prompt.md
│   ├── task-checklist.md
│   ├── implementation-plan.md
│   ├── requirements.md
│   ├── progress.md
│   └── architecture.md
├── docker-compose.yml # Docker Compose 编排文件（空）
├── .env.example       # 环境变量示例（空）
└── README.md          # 项目说明
```

---

## 文件清单

### 顶层文件

| 文件路径 | 作用 | 创建阶段 | 创建时间 |
|----------|------|----------|----------|
| `docker-compose.yml` | Docker Compose 编排文件，定义三个服务（MySQL、Node.js、Nginx）的容器配置 | 阶段〇 | 2026-03-21 |
| `.env.example` | 环境变量示例文件，包含所有必需的环境变量模板和注释 | 阶段〇 | 2026-03-21 |
| `README.md` | 项目说明文档，包含项目简介、技术栈、快速开始等内容 | 阶段〇 | 2026-03-21 |

### 目录结构

| 目录路径 | 作用 | 创建阶段 | 创建时间 |
|----------|------|----------|----------|
| `frontend/` | React 前端项目目录，包含所有前端源代码 | 阶段〇 | 2026-03-21 |
| `backend/` | Node.js 后端项目目录，包含所有后端源代码 | 阶段〇 | 2026-03-21 |
| `docker/` | Docker 相关配置文件目录，包含 Nginx 配置和前端 Dockerfile | 阶段〇 | 2026-03-21 |
| `docs/` | 项目文档目录，包含部署文档、API 文档、管理员手册等 | 阶段〇 | 2026-03-21 |

---

## 后端文件（待创建）

> 后端文件将在阶段一至阶段三创建，届时在此更新。

---

## 前端文件补充 (SEO 优化阶段)

在 2026-03-28 实施的全局 SEO 优化阶段中，为了使依赖 JavaScript 渲染的 SPA 能够被搜索引擎（如 Googlebot）友好地抓取和解析，且确保在社交媒体上分享时拥有富文本和图像预览，对前端架构进行了以下增强和新增：

### 新增文件清单

| 文件路径 | 作用职责 | 架构洞察与原理 |
|----------|----------|----------------|
| `frontend/public/robots.txt` | 爬虫协议规则 | 指引搜索引擎爬虫的抓取范围，允许抓取全站内容（`/`），但拦截不需要被索引的管理后台（`/admin/`）与纯接口端点（`/api/`），以此节省 Crawl Budget。 |
| `frontend/public/sitemap.xml` | 站点地图 | 提供主动告知搜索引擎的 URL 列表与抓取优先级，提升首页被发现和索引的速度。该文件随构建流程直接静态输出至 `dist/`。 |
| `frontend/src/components/SEO.tsx` | 动态 Head 标签管理器 | 基于 `react-helmet-async` 封装的组件。通过 React 虚拟 DOM 的状态驱动，在运行时动态覆盖 `<head>` 中的 `<title>`, meta `description`, 以及 `og:` 和 `twitter:` 系列标签，解决了 SPA 路由切换时元数据不变的痛点。 |

### 架构侧改进洞察

1. **结构化数据 (JSON-LD) 的集成**
   - 在 `index.html` 中引入固定的 `application/ld+json` (WebSite 模式)，让搜索引擎精确理解站点的名称、支持的多语言环境以及核心的搜索入口意图。
   
2. **SPA 预渲染 (Prerendering)**
   - **痛点**: 原生 Vite + React 产出的 `index.html` 只有一个空 `<div id="root">` 闭合节点，这会导致只能扫描静态 HTML 的爬虫完全丢失页面首屏内容。
   - **架构解法**: 引入 `vite-plugin-prerender` 与无头浏览器 (PuppeteerRenderer)。
   - **实现机制**: 在 `vite build` 产出普通前端包的末期，插件启动无头 Chromium 访问挂载在内存中的该站点，延时 (renderAfterTime: 3000ms) 等待配置数据和产品列表 API 完成异步获取、React 完成 DOM 节点的映射渲染后，将最终含具体卡片和文字的 DOM 反填入构建结果的 `dist/index.html`。
   - **兼容处理**: 因构建链 ESM 不兼容该生态遗留包内部的 `require` 用法，我们在 `vite.config.ts` 中巧妙使用 `module.createRequire` 显式走 CommonJS 树规避了该问题，保证了构建链路的流畅和自动化。

3. **上下文边界管理**
   - 核心层引入 `HelmetProvider` 控制跨组件渲染时的副作用。
   - 国际化 `i18n` 事件结合 `document.documentElement.lang`，打通了 React 生命周期外的底层 DOM API 闭环，确保语义规范无断层。

---

*最后更新：2026-03-28 by Antigravity*
