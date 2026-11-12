#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL to the production Postgres connection string}"
: "${SUPABASE_URL:?Set SUPABASE_URL to the production project URL}"
: "${SUPABASE_SERVICE_ROLE_KEY:?Set SUPABASE_SERVICE_ROLE_KEY in your local shell only}"
: "${BACKUP_PASSPHRASE:?Set a strong one-time BACKUP_PASSPHRASE in your local shell only}"

command -v pg_dump >/dev/null || { echo "pg_dump is required (PostgreSQL client tools)." >&2; exit 1; }
command -v gpg >/dev/null || { echo "gpg is required for AES-256 encryption." >&2; exit 1; }
command -v tar >/dev/null || { echo "tar is required." >&2; exit 1; }

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DEST="${BACKUP_DIR:-$PWD/amar-shopping-backups}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
mkdir -p "$DEST"
chmod 700 "$DEST"

echo "Creating read-only PostgreSQL custom-format dump..."
pg_dump "$SUPABASE_DB_URL" --format=custom --no-owner --no-acl --verbose --file "$WORK/production.dump"

echo "Exporting Storage objects..."
BACKUP_STORAGE_DIR="$WORK/storage" node scripts/backup-supabase-storage.mjs

cat > "$WORK/backup-manifest.txt" <<EOF
Project: amar-shopping (awqnglmraehpxyhezhdx)
Created UTC: $STAMP
Database: PostgreSQL custom-format pg_dump (schema + data)
Storage: every bucket and object enumerated via authenticated Storage API
Secrets: not included
Restore: see BACKUP-RESTORE.md
EOF

echo "Encrypting backup archive with GPG AES-256..."
tar -C "$WORK" -czf "$WORK/amar-shopping-$STAMP.tar.gz" production.dump storage backup-manifest.txt
gpg --batch --yes --pinentry-mode loopback --passphrase "$BACKUP_PASSPHRASE" --symmetric --cipher-algo AES256 --output "$DEST/amar-shopping-$STAMP.tar.gz.gpg" "$WORK/amar-shopping-$STAMP.tar.gz"
sha256sum "$DEST/amar-shopping-$STAMP.tar.gz.gpg" > "$DEST/amar-shopping-$STAMP.tar.gz.gpg.sha256"
chmod 600 "$DEST/amar-shopping-$STAMP.tar.gz.gpg" "$DEST/amar-shopping-$STAMP.tar.gz.gpg.sha256"

echo
echo "Encrypted backup created: $DEST/amar-shopping-$STAMP.tar.gz.gpg"
echo "Checksum created: $DEST/amar-shopping-$STAMP.tar.gz.gpg.sha256"
echo "Keep the passphrase separately. Copy the encrypted file to a second secure location."
echo "This script does not change production data or schema."
