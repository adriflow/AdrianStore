#!/usr/bin/env bash
# Backup de AdrianStore: base de datos PostgreSQL + fotos subidas.
#
# Uso:
#   ./deploy/backup.sh [directorio_destino]   # por defecto /opt/adrianstore/backups
#
# Cron sugerido (diario a las 3:00 AM, como root o el usuario del servicio):
#   0 3 * * * /opt/adrianstore/deploy/backup.sh >/dev/null 2>&1

set -euo pipefail

BACKUP_ROOT="${1:-/opt/adrianstore/backups}"
UPLOADS_DIR="/opt/adrianstore/backend/uploads"
ENV_FILE="/opt/adrianstore/backend/.env"
RETENTION_DAYS=14

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: no existe $ENV_FILE" >&2
  exit 1
fi

DB_HOST="$(grep -E '^DB_HOST=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
DB_PORT="$(grep -E '^DB_PORT=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
DB_USER="$(grep -E '^DB_USER=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
DB_PASSWORD="$(grep -E '^DB_PASSWORD=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
DB_NAME="$(grep -E '^DB_NAME=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")"

DB_PORT="${DB_PORT:-5432}"
export PGPASSWORD="$DB_PASSWORD"

STAMP="$(date +%Y%m%d_%H%M%S)"
DEST="$BACKUP_ROOT/$STAMP"
mkdir -p "$DEST"

echo "==> Respaldando base de datos ($DB_NAME)"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" | gzip > "$DEST/db.sql.gz"

echo "==> Respaldando fotos ($UPLOADS_DIR)"
if [ -d "$UPLOADS_DIR" ]; then
  cp -a "$UPLOADS_DIR/." "$DEST/uploads/"
fi

echo "==> Limpiando respaldos de más de $RETENTION_DAYS días"
find "$BACKUP_ROOT" -maxdepth 1 -type d -mtime "+$RETENTION_DAYS" -exec rm -rf {} \;

echo "==> Backup completado en $DEST"
