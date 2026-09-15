#!/usr/bin/env bash
# Nightly Postgres backup. Gated by the `backups_enabled` app setting (Admin -> gear
# icon -> Backups, defaults OFF) so installing the cron entry below doesn't start
# writing dumps until someone explicitly turns it on.
#
# Intended to run via host cron from the repo root, e.g.:
#   0 3 * * * cd /path/to/Makerspace-XP && ./backend/scripts/backup_db.sh >> backend/backups/backup.log 2>&1
#
# Writes to $BACKUP_DIR (default: backend/backups/, gitignored) and deletes dumps older
# than $RETENTION_DAYS (default: 14). This is a logical backup (pg_dump), not
# point-in-time recovery — see Issues/015 for what's still needed before this is a real
# disaster-recovery plan (most importantly: copying dumps OFF this host).

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../.."

BACKUP_DIR="${BACKUP_DIR:-backend/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
POSTGRES_USER="${POSTGRES_USER:-makerspace}"
POSTGRES_DB="${POSTGRES_DB:-makerspace_xp}"

timestamp="$(date +%Y%m%d-%H%M%S)"
echo "[$timestamp] backup_db.sh starting"

enabled="$(docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc \
  "SELECT backups_enabled FROM app_settings WHERE id = 1;" | tr -d '[:space:]')"

if [ "$enabled" != "t" ]; then
  echo "[$timestamp] Backups disabled (Admin -> gear icon -> Backups) — skipping."
  exit 0
fi

mkdir -p "$BACKUP_DIR"
dump_file="$BACKUP_DIR/${POSTGRES_DB}_${timestamp}.sql.gz"

docker compose exec -T db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" | gzip > "$dump_file"
echo "[$timestamp] Wrote $dump_file ($(du -h "$dump_file" | cut -f1))"

find "$BACKUP_DIR" -name "${POSTGRES_DB}_*.sql.gz" -mtime "+${RETENTION_DAYS}" -print -delete

echo "[$timestamp] backup_db.sh done"
