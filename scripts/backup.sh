#!/usr/bin/env bash
# Plik: scripts/backup.sh
# Cel: Codzienny backup bazy PostgreSQL (pg_dump) z kompresją i rotacją.
#      Opcjonalnie wysyłka do S3/Backblaze (jeśli skonfigurowano awscli).
# Użycie (cron): 0 3 * * *  /app/scripts/backup.sh >> /var/log/apka-backup.log 2>&1
# Wymaga: DATABASE_URL, pg_dump. Opcjonalnie: BACKUP_DIR, BACKUP_S3_BUCKET, aws CLI.
set -euo pipefail

: "${DATABASE_URL:?Ustaw DATABASE_URL}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/apkafirmowa}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
TS="$(date +%Y%m%d_%H%M%S)"
FILE="${BACKUP_DIR}/apkafirmowa_${TS}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[backup] Zrzut bazy → ${FILE}"
pg_dump "$DATABASE_URL" | gzip -9 > "$FILE"

# Rotacja: usuń backupy starsze niż RETENTION_DAYS.
find "$BACKUP_DIR" -name 'apkafirmowa_*.sql.gz' -mtime "+${RETENTION_DAYS}" -delete

# Opcjonalna wysyłka do S3 (jeśli ustawiono bucket i dostępny aws CLI).
if [[ -n "${BACKUP_S3_BUCKET:-}" ]] && command -v aws >/dev/null 2>&1; then
  echo "[backup] Wysyłka do s3://${BACKUP_S3_BUCKET}/"
  aws s3 cp "$FILE" "s3://${BACKUP_S3_BUCKET}/$(basename "$FILE")"
fi

echo "[backup] Gotowe."
