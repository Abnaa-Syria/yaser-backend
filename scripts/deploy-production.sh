#!/usr/bin/env bash
# Run ON the production VPS as root (or deploy user).
# Syncs backend + frontend from GitHub, rebuilds, and restarts services.
set -euo pipefail

BACKEND_DIR="/var/www/api.alienparts.online"
FRONTEND_DIR="/var/www/alienparts.online"
PM2_APP="yaser-api"

log() { echo "[deploy] $*"; }

deploy_git_repo() {
  local dir="$1"
  log "sync $dir"
  cd "$dir"
  test -d .git || { echo "Not a git repo: $dir" >&2; exit 1; }

  if [ -f .env ]; then
    cp .env "/tmp/.env.backup.$(basename "$dir")"
  fi

  git fetch origin
  git reset --hard origin/main
  # Never delete .env, uploads, or node_modules.
  git clean -fd -e .env -e uploads -e node_modules 2>/dev/null || git clean -fd

  if [ -f .env ]; then
    : # kept by exclude
  elif [ -f "/tmp/.env.backup.$(basename "$dir")" ]; then
    cp "/tmp/.env.backup.$(basename "$dir")" .env
  fi
}

log "=== BACKEND ==="
deploy_git_repo "$BACKEND_DIR"
cd "$BACKEND_DIR"
npm install --no-audit --no-fund
npx prisma generate
npm run build
pm2 restart "$PM2_APP"
pm2 status "$PM2_APP" | head -15

log "=== FRONTEND ==="
deploy_git_repo "$FRONTEND_DIR"
cd "$FRONTEND_DIR"
npm install --no-audit --no-fund
npm run build
nginx -t
systemctl reload nginx

log "=== SMOKE ==="
curl -fsS "http://127.0.0.1:3000/api/health" | head -c 200 || curl -fsS "http://127.0.0.1/api/health" | head -c 200 || true
echo
curl -fsSI "http://127.0.0.1/" | head -5 || true

log "DONE — synced to origin/main, rebuilt, restarted"
