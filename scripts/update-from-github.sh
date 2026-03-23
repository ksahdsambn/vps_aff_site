#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REMOTE="${REMOTE:-origin}"
BRANCH="${BRANCH:-master}"
ENV_FILE="${ENV_FILE:-.env}"

log() {
  printf '[%s] %s\n' "$(date '+%F %T')" "$*"
}

if ! command -v git >/dev/null 2>&1; then
  log "git is not installed"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  log "docker is not installed"
  exit 1
fi

cd "${PROJECT_DIR}"

if [ ! -d .git ]; then
  log "Missing .git in ${PROJECT_DIR}. Clone the GitHub repository instead of uploading a zip package."
  exit 1
fi

if [ ! -f "${ENV_FILE}" ]; then
  log "Missing ${ENV_FILE}. Create and verify it before running the update task."
  exit 1
fi

TMP_ENV="$(mktemp)"
cp "${ENV_FILE}" "${TMP_ENV}"

restore_env() {
  if [ -f "${TMP_ENV}" ]; then
    cp "${TMP_ENV}" "${ENV_FILE}"
    rm -f "${TMP_ENV}"
  fi
}

trap restore_env EXIT

log "Project directory: ${PROJECT_DIR}"
log "Fetching ${REMOTE}/${BRANCH}"
git fetch "${REMOTE}" "${BRANCH}"

log "Resetting tracked files to ${REMOTE}/${BRANCH}"
git reset --hard "${REMOTE}/${BRANCH}"

log "Restoring local ${ENV_FILE}"
cp "${TMP_ENV}" "${ENV_FILE}"

log "Rebuilding and recreating containers"
docker compose up -d --build --remove-orphans

log "Container status"
docker compose ps

log "Update completed"
