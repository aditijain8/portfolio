# Backup and restore

Everything that matters is in PostgreSQL: projects, profile, resume metadata **and the PDF/image bytes** (`STORAGE_TYPE=database`, the default). One database backup therefore covers the whole site.

If you use `STORAGE_TYPE=local`, also back up the directory in `STORAGE_LOCAL_DIR` (Docker volume `uploads`, mounted at `/app/data`).

## Back up

```bash
# any PostgreSQL (use the connection string from your host, e.g. Neon's)
pg_dump --format=custom --no-owner --file=portfolio-$(date +%F).dump "$DATABASE_URL"

# local docker compose
docker compose exec -T db pg_dump -U portfolio -Fc portfolio > portfolio-$(date +%F).dump
```

Store dumps somewhere other than the database host (private cloud drive, another machine). Free hosts generally do **not** include dependable backups (Render's free Postgres states "no backups" in its docs; check your provider's current terms for the others), so schedule this yourself (monthly is reasonable, and always before a big edit session).

Optional automation: a scheduled GitHub Actions workflow that runs `pg_dump` with the connection string stored as a repository **secret** and uploads the dump as a private artifact.

## Restore

```bash
# into an empty database (Flyway will see the schema_history table and skip applied migrations)
pg_restore --no-owner --clean --if-exists --dbname="$DATABASE_URL" portfolio-2026-10-25.dump

# local docker compose
docker compose exec -T db pg_restore -U portfolio -d portfolio --clean --if-exists < portfolio-2026-10-25.dump
```

Then start the backend. The administrator account is part of the dump, so you can sign in with the old password; use `ADMIN_RESET` (see ADMIN_SETUP.md) if needed.

## Test your backups

Restore a dump into a scratch database at least once and open the site against it. An untested backup is not a backup.
