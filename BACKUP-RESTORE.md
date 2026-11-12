# Amar Shopping production backup and restore guide

## Important boundaries

- Run backup commands on a trusted computer with PostgreSQL client tools, Node.js, and GnuPG installed.
- Never paste database URLs, service-role keys, or backup passphrases into chat, GitHub, source files, or screenshots.
- The script performs a read-only PostgreSQL dump and authenticated Storage downloads. It does not change production data.
- Supabase Auth users, project secrets, Edge Function secrets, Auth configuration, and provider credentials are not included in the database dump or Storage export. Record/recover these separately using the project's secure settings and secret manager.
- Keep the encrypted archive and passphrase in separate secure locations. A backup is not verified until checksum, decryption, archive integrity, and restore into a separate disposable database have all passed.

## Create the backup

From a trusted local terminal, clone the repository and switch to the backup branch containing the scripts. Install PostgreSQL client tools, Node.js, and GnuPG.

Set secrets only in your terminal session or a local secret manager (do not commit an .env file):

```bash
export SUPABASE_DB_URL='postgresql://...'
export SUPABASE_URL='https://awqnglmraehpxyhezhdx.supabase.co'
export SUPABASE_SERVICE_ROLE_KEY='...'
export BACKUP_PASSPHRASE='a-long-unique-passphrase'
export BACKUP_DIR="$HOME/secure-backups/amar-shopping"
bash scripts/backup-production.sh
```

Use the production database connection string from Supabase Dashboard > Project Settings > Database. Prefer the direct connection when your network supports IPv6; otherwise use the Supavisor session pooler connection string shown in the dashboard. Never store it in Git.

## Verify the archive

```bash
cd "$BACKUP_DIR"
sha256sum -c amar-shopping-*.tar.gz.gpg.sha256
gpg --batch --pinentry-mode loopback --passphrase "$BACKUP_PASSPHRASE" -o /tmp/amar-shopping-backup.tar.gz -d amar-shopping-<timestamp>.tar.gz.gpg
tar -tzf /tmp/amar-shopping-backup.tar.gz
```

Then restore the PostgreSQL dump into a separate disposable PostgreSQL database (never production) and confirm expected schemas/tables/row counts. Recreate Storage buckets in a disposable project and compare downloaded object counts and checksums. Only after that is it a verified restore test. Delete the temporary plaintext archive securely after verification.

## Restore (disposable target first)

```bash
mkdir -p /tmp/amar-shopping-restore
tar -xzf /tmp/amar-shopping-backup.tar.gz -C /tmp/amar-shopping-restore
pg_restore --list /tmp/amar-shopping-restore/production.dump
# Create an empty disposable PostgreSQL database, then:
pg_restore --clean --if-exists --no-owner --no-acl --dbname="$DISPOSABLE_DATABASE_URL" /tmp/amar-shopping-restore/production.dump
```

Storage objects in `storage/<bucket>/<object path>` must be uploaded to buckets created in the disposable target. Do not point restore commands at the live project.

## Production change gate

Do not merge the marketplace migration or deploy the frontend until:
1. A current encrypted database + Storage backup has been created outside GitHub.
2. Checksum and decryption succeed.
3. PostgreSQL dump restores into a disposable database.
4. Storage objects have been enumerated and integrity checked.
5. The migration is reviewed against the actual production schema and tested against a staging copy.
6. Rollback steps and an explicit deployment window are agreed.

A Git branch is a source-code backup only. It is not a database backup.
