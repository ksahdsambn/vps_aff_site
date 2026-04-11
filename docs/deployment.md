# VPS AFF 网站部署文档

适用场景：`Debian 12 + 1Panel + Docker Compose + OpenResty + HTTPS`

本文档按“从 GitHub 拉取源码，在 1Panel 中创建编排，用 1Panel 网站功能做反向代理，用 1Panel 计划任务从 GitHub 自动更新并直接应用到容器”的方式编写。

## 1. 部署目标

部署完成后，整体结构如下：

1. 1Panel 负责管理服务器、OpenResty、网站反向代理、HTTPS 证书、计划任务。
2. 项目代码通过 GitHub 克隆到服务器。
3. Docker Compose 负责启动 `db`、`backend`、`frontend` 三个服务。
4. 1Panel 网站把域名流量反向代理到宿主机 `127.0.0.1:8080`。
5. `frontend` 容器内部再把 `/api/` 请求转发到 `backend:3000`。
6. 后续更新不再手工上传压缩包，而是由 1Panel 计划任务执行脚本，从 GitHub 同步最新代码并重建容器。

## 2. 前置条件

开始前请确认：

- 服务器系统为 Debian 12。
- 1Panel 已安装并可正常登录。
- 服务器至少有 2 核 CPU、4 GB 内存、20 GB 可用磁盘。
- 域名已解析到当前服务器公网 IP。
- 安全组或防火墙已放行 `80` 和 `443` 端口。
- 服务器可访问 GitHub。

如果服务器尚未安装 `git`，先执行：

```bash
apt update
apt install -y git
```

如果 1Panel 尚未安装，请先按 1Panel 官方文档完成安装与首次初始化。

## 3. 推荐的目录规划

推荐把项目放在 1Panel 网站目录下，便于统一管理。以下示例使用域名 `xmde.de`：

```bash
mkdir -p /opt/1panel/www/sites/xmde.de/index
cd /opt/1panel/www/sites/xmde.de/index
git clone https://github.com/ksahdsambn/vps_aff_site.git
cd vps_aff_site
git checkout master
```

推荐最终路径：

```text
/opt/1panel/www/sites/xmde.de/index/vps_aff_site
```

建议不要把仓库直接克隆到 `index` 根目录，而是保留一个独立子目录 `vps_aff_site`，这样网站目录和项目目录更容易区分。

## 4. 先在 1Panel 安装 OpenResty

操作路径：

1. 进入 `应用商店`。
2. 搜索 `OpenResty`。
3. 点击安装。

安装时确认：

- HTTP 端口：`80`
- HTTPS 端口：`443`

如果 `80` 或 `443` 已被其他程序占用，先解决端口冲突，再继续下面步骤。

## 5. 从 GitHub 获取项目代码

强烈建议从第一天就使用 GitHub 克隆方式部署，不要用“上传压缩包再解压”的方式上线这个项目。原因很直接：

1. 你后面要使用 1Panel 计划任务从 GitHub 更新。
2. 自动更新脚本依赖仓库中的 `.git` 目录。
3. 如果你一开始是上传压缩包，后续还要额外把目录改造成 Git 仓库，反而更麻烦。

标准操作如下：

```bash
cd /opt/1panel/www/sites/xmde.de/index
git clone https://github.com/ksahdsambn/vps_aff_site.git
cd vps_aff_site
git checkout master
```

克隆完成后，确认下面这些文件都在项目根目录：

```text
backend/
frontend/
docker/
docs/
markdown/
scripts/
.env.example
docker-compose.yml
README.md
```

## 6. 准备 `.env`

在项目根目录执行：

```bash
cd /opt/1panel/www/sites/xmde.de/index/vps_aff_site
cp .env.example .env
```

然后在 1Panel 文件管理器里打开 `.env`，按实际环境修改。下面给出一份可直接参考的生产示例：

```env
MYSQL_ROOT_PASSWORD=replace_with_strong_root_password
MYSQL_DATABASE=vps_aff_db
MYSQL_USER=vps_app
MYSQL_PASSWORD=replace_with_strong_app_password
JWT_SECRET=replace_with_long_random_secret
CORS_ORIGIN=https://xmde.de,https://www.xmde.de
DATABASE_URL=mysql://vps_app:replace_with_strong_app_password@db:3306/vps_aff_db
PORT=3000
```

请特别注意以下规则：

1. `MYSQL_PASSWORD` 和 `DATABASE_URL` 中的密码必须一致。
2. `MYSQL_DATABASE` 和 `DATABASE_URL` 中的数据库名必须一致。
3. `CORS_ORIGIN` 必须写正式访问地址，不要继续保留 `http://localhost`。
4. 如果你只使用一个域名，例如只用 `https://xmde.de`，那就只写一个地址。
5. `DATABASE_URL` 中数据库主机必须保持 `db`，不要改成 `localhost`。
  


  
## 7. 修改 `docker-compose.yml` 以适配 1Panel

当前项目默认把前端容器直接发布到宿主机 `80` 端口。这个写法在 1Panel 场景下不合适，因为：

1. `80` 和 `443` 端口应该由 OpenResty 和 1Panel 网站统一接管。
2. 如果前端容器继续直接占用 `80`，1Panel 网站功能和 HTTPS 证书会冲突。

### 7.1 需要修改的地方

把 `frontend` 服务中的端口映射：

```yaml
ports:
  - "80:80"
```

改成：

```yaml
ports:
  - "127.0.0.1:8080:80"
```

也就是说，最终 `docker-compose.yml` 中 `frontend` 段应类似这样：

```yaml
  frontend:
    build:
      context: .
      dockerfile: docker/frontend/Dockerfile
    depends_on:
      - backend
    ports:
      - "127.0.0.1:8080:80"
    networks:
      - app_network
```

### 7.2 为什么要绑定到 `127.0.0.1`

推荐写成：

```yaml
- "127.0.0.1:8080:80"
```

而不是：

```yaml
- "8080:80"
```

原因是：

1. `127.0.0.1:8080` 只允许本机访问，更安全。
2. 1Panel 网站反向代理与 OpenResty 都在同一台服务器上，可以正常转发到这个地址。
3. 这样不会把前端容器的 8080 端口直接暴露给公网。

如果 `8080` 已被占用，可以改成别的端口，比如：

```yaml
- "127.0.0.1:18080:80"
```

但后面的 1Panel 网站代理地址也必须同步改成 `http://127.0.0.1:18080`。

### 7.3 不要改动的地方

以下配置保持现状即可：

- `db` 服务名
- `backend` 服务名
- `frontend` 容器内部端口 `80`
- `backend` 容器内部端口 `3000`
- 数据库主机名 `db`

这些名字已经和项目内部代理关系对齐，不建议再改。

## 8. 在 1Panel 中创建容器编排

操作路径：

1. 进入 `容器`。
2. 进入 `编排`。
3. 点击 `创建编排`。
4. 选择 `路径选择`。

推荐填写方式：

- 编排名称：`vps-aff-site`
- Compose 文件路径：`/opt/1panel/www/sites/xmde.de/index/vps_aff_site/docker-compose.yml`

如果 1Panel 页面支持设置工作目录，请使用：

```text
/opt/1panel/www/sites/xmde.de/index/vps_aff_site
```

如果页面支持设置环境文件，请选择：

```text
/opt/1panel/www/sites/xmde.de/index/vps_aff_site/.env
```

保存后启动编排。

### 8.1 首次启动时会发生什么

首次启动通常会自动完成：

1. 启动 MySQL 容器。
2. 等待数据库健康检查通过。
3. 构建并启动后端容器。
4. 执行 Prisma migration。
5. 执行运行时 seed。
6. 构建并启动前端容器。

### 8.2 启动后应看到的服务

在 1Panel 编排详情中，正常情况下你会看到 3 个服务都处于运行状态：

- `db`
- `backend`
- `frontend`

如果你在终端检查，也可以执行：

```bash
cd /opt/1panel/www/sites/xmde.de/index/vps_aff_site
docker compose ps
```

### 8.3 首次启动后的本机验证

在绑定域名之前，先验证宿主机本地访问是否正常：

```bash
curl -I http://127.0.0.1:8080
curl http://127.0.0.1:8080/api/config
curl http://127.0.0.1:8080/api/products?page=1&pageSize=3
```

如果后端启动异常，可以进一步看日志：

```bash
cd /opt/1panel/www/sites/xmde.de/index/vps_aff_site
docker compose logs backend --tail=100
docker compose logs frontend --tail=100
docker compose logs db --tail=100
```

### 8.4 在 1Panel 中创建网站并绑定域名

编排启动成功后，再配置网站。

#### 8.4.1 创建网站

操作路径：

1. 进入 `网站`。
2. 点击 `创建网站`。
3. 选择 `反向代理` 类型。

#### 8.4.2 推荐填写方式

假设正式域名为 `xmde.de`，则推荐：

- 主域名：`xmde.de`
- 代理地址：`http://127.0.0.1:8080`

如果你还要支持 `www.xmde.de`，有两种做法：

1. 在同一个网站里追加域名别名。
2. 再建一个网站，把 `www.xmde.de` 反代到同一个地址。

#### 8.4.3 为什么只代理到前端容器

因为当前项目的前端容器已经内置 Nginx，并且已经处理了：

1. 前端静态页面访问。
2. `/api/` 请求代理到 `backend:3000`。

所以在 1Panel 网站层面，你只需要把域名代理到前端容器暴露出来的本机端口即可，不需要再额外给后端单独配一条网站规则。

## 9. 在 1Panel 中申请并启用 HTTPS

### 9.1 申请证书

操作路径：

1. 进入 `证书`。
2. 点击 `申请证书`。

常见建议：

- 域名已正确解析且 80 端口可用：优先用 HTTP 验证。
- 使用 CDN 或 80 端口不能直接验证：使用 DNS 验证。

### 9.2 启用 HTTPS

证书签发成功后，回到对应网站配置页，开启：

- HTTPS
- 证书绑定
- 自动跳转 HTTPS

### 9.3 HTTPS 启用后必须复核

确认以下内容：

1. 浏览器访问的是 `https://`。
2. 首页能正常打开。
3. 后台登录页 `/admin/login` 能正常打开。
4. 浏览器控制台没有 CORS 报错。

如果这里出现跨域问题，优先检查 `.env` 里的：

```env
CORS_ORIGIN=https://xmde.de,https://www.xmde.de
```

## 10. 首次验收

### 10.1 访问前台首页

访问：

```text
https://xmde.de/
```

确认：

- 页面能打开
- 产品列表能加载
- 切换中英文正常

### 10.2 访问后台登录页

访问：

```text
https://xmde.de/admin/login
```

### 10.3 使用默认管理员登录

首次部署成功后，系统会自动创建默认管理员：

```text
username: admin
password: admin123
```

如果这里登录失败，优先检查后端日志：

```bash
cd /opt/1panel/www/sites/xmde.de/index/vps_aff_site
docker compose logs backend --tail=100
```

### 10.4 校验基础配置功能

登录后台后建议至少测试：

1. 公告保存后前台能显示。
2. 站点标题和社交链接能保存。
3. 商品新增、修改、删除正常。

## 11. 日常维护

### 11.1 查看运行状态

日常运维优先使用 1Panel：

1. `容器 -> 编排 -> 当前项目`
2. `网站 -> 当前站点`
3. `证书 -> 当前证书`

必要时也可以在终端执行：

```bash
cd /opt/1panel/www/sites/xmde.de/index/vps_aff_site
docker compose ps
docker compose logs backend --tail=100
docker compose logs frontend --tail=100
```

### 11.2 重启服务

如果只是访问异常，但没有改代码，可以先在 1Panel 中：

1. 重启当前编排。
2. 或只重启 `backend` / `frontend`。

终端等价命令如下：

```bash
cd /opt/1panel/www/sites/xmde.de/index/vps_aff_site
docker compose restart
```

### 11.3 更新项目：使用 1Panel 计划任务 + GitHub + 自动重建容器

这一节是本文档的重点。后续更新不要再用“手工上传文件 + 手工点重建”的方式，而是改成：

1. 本地把修改推送到 GitHub。
2. 服务器上的 1Panel 计划任务定时执行更新脚本。
3. 更新脚本拉取 GitHub 最新代码并执行 `docker compose up -d --build --remove-orphans`。

#### 11.3.1 先确认服务器目录中存在更新脚本

仓库已经包含更新脚本：

```text
scripts/update-from-github.sh
```

部署完成后的实际路径示例：

```text
/opt/1panel/www/sites/xmde.de/index/vps_aff_site/scripts/update-from-github.sh
```

你也可以手动看一下脚本内容：

```bash
cd /opt/1panel/www/sites/xmde.de/index/vps_aff_site
cat scripts/update-from-github.sh
```

脚本核心逻辑如下：

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REMOTE="${REMOTE:-origin}"
BRANCH="${BRANCH:-master}"
ENV_FILE="${ENV_FILE:-.env}"

cd "${PROJECT_DIR}"

TMP_ENV="$(mktemp)"
cp "${ENV_FILE}" "${TMP_ENV}"

git fetch "${REMOTE}" "${BRANCH}"
git reset --hard "${REMOTE}/${BRANCH}"
cp "${TMP_ENV}" "${ENV_FILE}"

docker compose up -d --build --remove-orphans
docker compose ps
```

这段脚本做了 5 件事：

1. 自动定位项目根目录，不需要手工改项目路径。
2. 先备份服务器本地 `.env`。
3. 从 GitHub 获取 `origin/master` 最新代码。
4. 用远端分支覆盖所有受 Git 管理的文件。
5. 恢复服务器本地 `.env`，然后重建并重启容器。

这意味着：

- GitHub 上的代码会覆盖服务器里所有受 Git 管理的文件。
- 服务器本地 `.env` 会被保留。
- 如果你曾经在服务器里手工改过受 Git 管理的文件，但没有提交到 GitHub，这些改动会被更新脚本覆盖。

#### 11.3.2 在 1Panel 中创建计划任务

操作路径：

1. 进入 `计划任务`。
2. 点击 `创建任务`。
3. 任务类型选择 `Shell 脚本`。

推荐填写如下：

| 字段 | 推荐值 |
|---|---|
| 任务类型 | `Shell 脚本` |
| 任务名称 | `vps-aff-site-sync` |
| 分组 | `默认` |
| 执行周期 | 例如每周一 `01:30` |
| 在容器中执行 | 不勾选 |
| 用户 | `root` |
| 解释器 | 自定义 `/bin/bash` |

脚本内容直接填写这一行：

```bash
/bin/bash /opt/1panel/www/sites/xmde.de/index/vps_aff_site/scripts/update-from-github.sh
```

如果你的项目目录不是本文示例路径，只需要把上面的绝对路径改成你的实际部署路径。

#### 11.3.3 计划任务创建后先手工执行一次

不要直接依赖定时执行，先在 1Panel 任务页手工执行一次，或者在终端执行：

```bash
/bin/bash /opt/1panel/www/sites/xmde.de/index/vps_aff_site/scripts/update-from-github.sh
```

手工执行成功后，再启用周期调度。

#### 11.3.4 推荐的调度频率

如果你不是高频发布，推荐下面两种：

1. 每周一凌晨 `01:30`。
2. 每天凌晨 `03:00`。

不建议设置为过于频繁的分钟级任务，因为每次更新都可能触发镜像重建与容器重启。

#### 11.3.5 更新前后的标准流程

以后发版建议统一按这个顺序：

1. 本地改代码。
2. 本地测试通过。
3. 推送到 GitHub。
4. 等待 1Panel 计划任务执行，或在 1Panel 里手动执行一次任务。
5. 在 1Panel 编排页确认容器状态。
6. 打开前台和后台做一次快速验收。

#### 11.3.6 如果仓库是私有仓库

当前仓库如果改成私有仓库，计划任务更新之前还需要先解决服务器访问 GitHub 的认证问题。推荐做法：

1. 给服务器配置 GitHub SSH Deploy Key。
2. 把仓库远端改成 SSH 地址。

例如：

```bash
cd /opt/1panel/www/sites/xmde.de/index/vps_aff_site
git remote set-url origin git@github.com:ksahdsambn/vps_aff_site.git
```

如果你继续使用公开仓库，则不需要额外处理这一段。

### 11.4 数据备份建议

建议至少备份以下三类内容：

1. 项目目录备份。
2. 1Panel 网站与证书配置备份。
3. 整机快照或云盘快照。

如果只做最小可行备份，至少要保留：

```text
docker-compose.yml
.env
项目 Git 仓库
服务器快照
```

## 12. 常见问题排查

### 12.1 网站创建成功，但域名打不开

优先检查：

1. 域名是否解析到当前服务器。
2. `80` 和 `443` 是否已放行。
3. OpenResty 是否正常运行。
4. 网站代理地址是否写成了：

```text
http://127.0.0.1:8080
```

### 12.2 编排启动失败

优先检查：

1. `.env` 是否存在于项目根目录。
2. `.env` 中数据库密码与 `DATABASE_URL` 是否一致。
3. `docker-compose.yml` 是否已经把前端端口改成：

```yaml
- "127.0.0.1:8080:80"
```

### 12.3 首页能打开，但后台登录失败

优先检查：

```bash
cd /opt/1panel/www/sites/xmde.de/index/vps_aff_site
docker compose logs backend --tail=100
```

重点看是否出现：

- migration 执行失败
- seed 执行失败
- 数据库连接失败

### 12.4 启用 HTTPS 后出现跨域错误

优先检查 `.env`：

```env
CORS_ORIGIN=https://xmde.de,https://www.xmde.de
```

最常见错误是：

1. 页面已经走 `https://`，但 `CORS_ORIGIN` 还是 `http://`。
2. 实际用了 `www`，但 `.env` 里只写了裸域名。

### 12.5 修改了 GitHub 代码，但服务器页面没有变化

优先检查：

1. GitHub 是否真的收到了最新提交。
2. 1Panel 计划任务是否执行成功。
3. 任务输出里是否报 `git fetch` 或 `docker compose up` 错误。
4. 编排是否已经重新构建。

可手工验证：

```bash
cd /opt/1panel/www/sites/xmde.de/index/vps_aff_site
git log --oneline -n 3
docker compose ps
docker compose logs frontend --tail=50
```

### 12.6 计划任务执行后 `.env` 被覆盖了怎么办

按本文提供的脚本，`.env` 会先备份再恢复，正常不会被覆盖。

如果你自己改过脚本，请重新确认至少包含这两步：

```bash
cp .env "${TMP_ENV}"
cp "${TMP_ENV}" .env
```

### 12.7 服务器上手工改过代码，计划任务一跑就没了

这是预期行为。因为更新脚本会执行：

```bash
git reset --hard origin/master
```

所以：

1. 服务器上的受 Git 管理文件，应当只作为发布产物，不要直接手工改。
2. 所有正式改动都应先在本地完成，再推送到 GitHub。
