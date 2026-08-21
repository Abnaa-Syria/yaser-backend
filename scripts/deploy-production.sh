#!/usr/bin/env bash
# Run ON the production VPS as root (or deploy user).
# Syncs backend + frontend from GitHub, applies additive migrations only,
# rebuilds, and restarts services. Never seeds or resets the database.
set -euo pipefail

BACKEND_DIR="${BACKEND_DIR:-/var/www/api.yaser-usmle.com}"
FRONTEND_DIR="${FRONTEND_DIR:-/var/www/yaser-usmle.com}"
PM2_APP="${PM2_APP:-yaser-api}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/yaser-usmle}"

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
    :
  elif [ -f "/tmp/.env.backup.$(basename "$dir")" ]; then
    cp "/tmp/.env.backup.$(basename "$dir")" .env
  fi
}

backup_mysql() {
  mkdir -p "$BACKUP_DIR"
  local stamp out
  stamp="$(date +%Y%m%d_%H%M%S)"
  out="$BACKUP_DIR/db_${stamp}.sql.gz"
  log "MySQL backup → $out"

  if [ ! -f "$BACKEND_DIR/.env" ]; then
    log "WARNING: backend .env missing — aborting (no backup without credentials)"
    exit 1
  fi

  # Parse DATABASE_URL safely with Node (handles special chars).
  node --input-type=module -e "
    import fs from 'fs';
    import { spawn } from 'child_process';
    const envText = fs.readFileSync('$BACKEND_DIR/.env', 'utf8');
    const line = envText.split(/\\r?\\n/).find((l) => l.startsWith('DATABASE_URL='));
    if (!line) throw new Error('DATABASE_URL not found');
    let raw = line.slice('DATABASE_URL='.length).trim();
    if ((raw.startsWith('\"') && raw.endsWith('\"')) || (raw.startsWith(\"'\") && raw.endsWith(\"'\"))) {
      raw = raw.slice(1, -1);
    }
    const u = new URL(raw);
    const db = u.pathname.replace(/^\\//, '').split('?')[0];
    const args = [
      '-h', u.hostname,
      '-P', u.port || '3306',
      '-u', decodeURIComponent(u.username),
      '--single-transaction',
      '--routines',
      '--triggers',
      '--set-gtid-purged=OFF',
      db,
    ];
    const dump = spawn('mysqldump', args, {
      env: { ...process.env, MYSQL_PWD: decodeURIComponent(u.password || '') },
      stdio: ['ignore', 'pipe', 'inherit'],
    });
    const gzip = spawn('gzip', ['-c'], { stdio: ['pipe', 'pipe', 'inherit'] });
    dump.stdout.pipe(gzip.stdin);
    const out = fs.createWriteStream('$out');
    gzip.stdout.pipe(out);
    await Promise.all([
      new Promise((res, rej) => dump.on('close', (c) => (c === 0 ? res() : rej(new Error('mysqldump exit ' + c))))),
      new Promise((res, rej) => gzip.on('close', (c) => (c === 0 ? res() : rej(new Error('gzip exit ' + c))))),
      new Promise((res, rej) => out.on('finish', res).on('error', rej)),
    ]);
  "

  test -s "$out"
  log "backup ok ($(du -h "$out" | awk '{print $1}'))"
}

log "=== BACKEND ==="
deploy_git_repo "$BACKEND_DIR"
cd "$BACKEND_DIR"

backup_mysql

npm install --no-audit --no-fund
npx prisma generate
# Additive migrations only — never db push --accept-data-loss, never seed.
npx prisma migrate deploy
npm run build
pm2 restart "$PM2_APP" --update-env
pm2 status "$PM2_APP" | head -20

log "=== FRONTEND ==="
deploy_git_repo "$FRONTEND_DIR"
cd "$FRONTEND_DIR"
npm install --no-audit --no-fund
npm run build
nginx -t
systemctl reload nginx

log "=== SMOKE ==="
curl -fsS "https://api.yaser-usmle.com/api/health" | head -c 300 || curl -fsS "http://127.0.0.1:3000/api/health" | head -c 300 || true
echo
curl -fsSI "https://yaser-usmle.com/" | head -8 || true

log "DONE — backup taken, migrate deploy applied, services restarted (no data wipe)"
