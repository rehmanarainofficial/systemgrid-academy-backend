# SystemGrid Academy Backup Strategy

## What to Back Up

- PostgreSQL database.
- Uploaded resources stored in the `systemgrid_academy_uploads` Docker volume.
- Production `.env.docker` stored securely outside the server.

## Database Backup

PowerShell:

```powershell
.\scripts\backup-postgres.ps1
```

Manual Docker command:

```bash
mkdir -p backups
docker compose -f docker-compose.prod.yml --env-file .env.docker exec -T postgres pg_dump -U systemgrid -d systemgrid_academy -Fc -f /backups/systemgrid-academy.dump
```

## Restore

Stop the API before restoring:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.docker stop api
docker compose -f docker-compose.prod.yml --env-file .env.docker exec -T postgres pg_restore -U systemgrid -d systemgrid_academy --clean --if-exists /backups/systemgrid-academy.dump
docker compose -f docker-compose.prod.yml --env-file .env.docker start api
```

## Schedule

- Daily database backup.
- Weekly upload volume backup.
- Keep at least 7 daily, 4 weekly, and 3 monthly backups.
- Store one encrypted copy off-server.
- Test restore monthly on a staging database.

## Verification

After every backup:

- Confirm the dump file exists and has a non-zero size.
- Run a test restore on staging when possible.
- Record backup time, filename, and restore-test status in operations notes.
