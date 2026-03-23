# VPS AFF 网站

## 项目简介

这是一个用于展示和推广 VPS 产品的双语引流下单网站，包含前台展示与后台管理两部分。

前台能力：

- VPS 产品列表展示
- 按服务商、产品名称、位置筛选
- 价格与配置排序
- 分页与移动端适配
- 中英文切换
- 公告与社交链接展示

后台能力：

- 管理员登录
- 产品增删改查
- 中英文公告 Markdown 编辑
- 网站标题、Logo、社交链接配置

默认管理员账号：

- 用户名：`admin`
- 密码：`admin123`

## 技术栈

- 前端：React 19、TypeScript、Vite 8、Ant Design 6、React Router 7、i18next、Axios
- 后端：Node.js、Express 5、TypeScript、Prisma 7、JWT、bcryptjs、Helmet、CORS、express-rate-limit
- 数据库：MySQL 8.0
- 部署：Docker Compose、Nginx、Node 20 Alpine

## 快速开始

### 本地开发

前置要求：

- Node.js 20+
- npm 10+
- MySQL 8.0

1. 安装后端依赖并配置本地环境变量：

```bash
cd backend
npm ci
```

编辑 `backend/.env`，至少保证以下变量正确：

```env
DATABASE_URL=mysql://root:password@localhost:3306/vps_aff_db
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=password
DATABASE_NAME=vps_aff_db
DATABASE_PORT=3306
JWT_SECRET=replace_with_dev_secret
PORT=3000
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

2. 初始化数据库并启动后端：

```bash
cd backend
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

3. 启动前端开发服务器：

```bash
cd frontend
npm ci
npm run dev
```

4. 访问以下地址：

- 前台首页：`http://localhost:5173`
- 后台登录：`http://localhost:5173/admin/login`
- 本地后端 API：`http://localhost:3000/api`

### Docker 部署

1. 复制并编辑根目录环境变量：

```bash
cp .env.example .env
```

2. 构建并启动全部服务：

```bash
docker compose up -d --build
```

3. 检查服务状态：

```bash
docker compose ps
docker compose logs backend --tail=100
```

4. 访问以下地址：

- 前台首页：`http://localhost/`
- 后台登录：`http://localhost/admin/login`

说明：

- 根目录 `.env` 用于 Docker Compose 部署
- `backend/.env` 用于本地直接启动后端

## 目录结构

```text
vps_aff_site/
├── backend/                # Express + Prisma 后端
│   ├── prisma/             # Prisma schema / migrations / seed
│   └── src/                # 控制器、路由、中间件、工具
├── frontend/               # React + Vite 前端
│   └── src/                # 页面、组件、API 封装、多语言资源
├── docker/
│   ├── frontend/           # 前端镜像构建文件
│   └── nginx/              # Nginx 反向代理配置
├── docs/                   # 交付文档
├── markdown/               # 需求、实施计划、任务清单、进度记录
├── docker-compose.yml      # 三服务编排
├── .env.example            # Docker 部署环境变量模板
└── README.md               # 项目说明
```

## 文档链接

交付文档：

- [部署文档](docs/deployment.md)
- [API 文档](docs/api.md)
- [管理员手册](docs/admin-guide.md)

项目过程文档：

- [需求文档](markdown/requirements.md)
- [实施计划](markdown/implementation-plan.md)
- [任务清单](markdown/task-checklist.md)
- [开发进度](markdown/progress.md)
