#!/usr/bin/env bash
#
# vps_aff_site 自动部署脚本（供 1Panel 计划任务调用）
#
# 功能：
#   1. 拉取 GitHub 远端最新代码
#   2. 仅当远端有新提交时才：重建镜像 + 重建并重启容器（幂等，无新提交则什么都不做）
#   3. 部署完成后做 HTTP 健康检查，失败则报警并保留现场
#
# 在 1Panel 中使用：
#   计划任务 → 创建 → 类型「Shell 脚本」
#   名称：vps_aff_site 自动部署
#   执行周期：每 5 分钟（或按需）
#   脚本内容粘贴本文件全文，或填：
#     bash /opt/vps_aff_site/scripts/update-from-github.sh
#
set -Eeuo pipefail

# 非 TTY 环境下禁止 git 弹出交互式凭证提示（凭证来自 /root/.git-credentials，无需输入）
export GIT_TERMINAL_PROMPT=0
# 1Panel 计划任务可能是非登录 shell，显式补齐 PATH
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:${PATH:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${PROJECT_DIR:-$(cd "${SCRIPT_DIR}/.." && pwd)}"
REMOTE="${REMOTE:-origin}"
BRANCH="${BRANCH:-master}"
ENV_FILE="${ENV_FILE:-.env}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:8082/}"   # FRONTEND_PORT=8082
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-90}"               # 容器起身后探测总时长（秒）

log() {
  printf '[%s] %s\n' "$(date '+%F %T')" "$*"
}
err() {
  printf '[%s] [ERROR] %s\n' "$(date '+%F %T')" "$*" >&2
}

# ============== 预检 ==============
log "=== vps_aff_site 自动部署开始 ==="

if ! command -v git >/dev/null 2>&1; then
  err "git 未安装"
  exit 1
fi
if ! command -v docker >/dev/null 2>&1; then
  err "docker 未安装"
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  err "docker compose 不可用"
  exit 1
fi

cd "${PROJECT_DIR}"

if [ ! -d .git ]; then
  err "${PROJECT_DIR} 不是 git 仓库。请用 git clone 而不是上传 zip 包。"
  exit 1
fi
if [ ! -f "${ENV_FILE}" ]; then
  err "缺少 ${ENV_FILE}，请先创建并核对后再执行。"
  exit 1
fi

# .env 被 .gitignore 忽略，但为防万一仍备份，确保任何路径下都不会丢
TMP_ENV="$(mktemp)"
cp "${ENV_FILE}" "${TMP_ENV}"

restore_env() {
  local rc=$?
  if [ -f "${TMP_ENV}" ]; then
    cp "${TMP_ENV}" "${ENV_FILE}"
    rm -f "${TMP_ENV}"
  fi
  exit "${rc}"
}
trap restore_env EXIT

# ============== 拉取远端 ==============
log "项目目录: ${PROJECT_DIR}"
log "拉取 ${REMOTE}/${BRANCH} ..."
if ! git fetch "${REMOTE}" "${BRANCH}"; then
  err "git fetch 失败（检查网络或 /root/.git-credentials 是否有效）"
  exit 1
fi

LOCAL=$(git rev-parse HEAD)
REMOTE_SHA=$(git rev-parse "${REMOTE}/${BRANCH}")
if [ -z "${LOCAL}" ] || [ -z "${REMOTE_SHA}" ]; then
  err "无法读取提交哈希（local=${LOCAL} remote=${REMOTE_SHA}）"
  exit 1
fi
log "本地: ${LOCAL}"
log "远端: ${REMOTE_SHA}"

# 工作树脏检查：本地若有手动改动，拒绝继续以免被 reset 覆盖
if [ -n "$(git status --porcelain)" ]; then
  err "工作树有未提交改动，已中止部署以防覆盖："
  git status --short >&2 || true
  err "请在服务器上手动处理（commit / stash / checkout）后重试。"
  exit 1
fi

# ============== 判断是否需要部署 ==============
if [ "${LOCAL}" = "${REMOTE_SHA}" ]; then
  log "已是最新，无需部署。"
  log "=== 结束（无操作）==="
  exit 0
fi

log "检测到新提交，开始部署 ..."
git log --oneline "${LOCAL}..${REMOTE_SHA}" | head -20 || true

# ============== 部署 ==============
# 工作树已干净，安全硬重置
log "git reset --hard ${REMOTE}/${BRANCH}"
git reset --hard "${REMOTE}/${BRANCH}"

# 还原本地 .env（虽然被忽略，仍显式恢复以保万无一失）
cp "${TMP_ENV}" "${ENV_FILE}"

# 重建镜像 + 重建并重启容器
# --remove-orphans 只影响本 compose 项目内的孤儿容器，同机其它项目不受影响
log "构建镜像并重建容器 ..."
if ! docker compose up -d --build --remove-orphans; then
  err "构建或重建失败，保留现场（旧容器可能仍在运行）"
  err "排查：docker compose -f ${PROJECT_DIR}/docker-compose.yml logs --tail=50"
  exit 1
fi

# ============== 健康检查 ==============
log "等待前端就绪（最长 ${HEALTH_TIMEOUT}s）..."
ok=0
code="000"
for i in $(seq 1 "${HEALTH_TIMEOUT}"); do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "${HEALTH_URL}" 2>/dev/null || echo "000")
  # 200 = 正常；307 = locale 重定向（本项目首页默认行为，也算健康）
  if [ "${code}" = "200" ] || [ "${code}" = "307" ]; then
    ok=1
    log "前端就绪（HTTP ${code}，第 ${i}s）"
    break
  fi
  sleep 1
done

if [ "${ok}" != "1" ]; then
  err "前端在 ${HEALTH_TIMEOUT}s 内未就绪（最后 HTTP=${code}）"
  err "排查：docker compose -f ${PROJECT_DIR}/docker-compose.yml ps"
  err "      docker compose -f ${PROJECT_DIR}/docker-compose.yml logs --tail=50"
  exit 1
fi

log "当前容器状态："
docker compose ps

log "=== 部署成功完成 ==="
