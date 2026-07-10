# SystemGrid Academy Backend Deployment

## Production Checklist

- Use `NODE_ENV=production`.
- Keep `DATABASE_SYNCHRONIZE=false`.
- Use long random values for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `JWT_RESET_SECRET`.
- Set `FRONTEND_URL` to the deployed frontend origin, for example `https://academy.thesystemgrid.com`.
- Set `BACKEND_PUBLIC_URL` to the public API origin, for example `https://api-academy.thesystemgrid.com`.
- Configure `MAIL_*` variables or email OTP and notifications will return `503`.
- Configure uploads with either `STORAGE_DRIVER=local` or `STORAGE_DRIVER=s3`.
- Keep PostgreSQL behind the Docker network or a private firewall.
- Run migrations and catalog seeds after deploying a new app version.
- Keep `uploads` and PostgreSQL data on persistent volumes.
- Put the API behind Nginx/Caddy/Cloudflare with HTTPS.

## Environment

Create the production env file:

```bash
cp .env.docker.example .env.docker
```

Update at minimum:

```bash
DATABASE_PASSWORD=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_RESET_SECRET=
FRONTEND_URL=https://academy.thesystemgrid.com
BACKEND_PUBLIC_URL=https://api-academy.thesystemgrid.com

# Email (required in production)
MAIL_HOST=
MAIL_PORT=587
MAIL_USER=
MAIL_PASS=
MAIL_FROM_NAME=SystemGrid Academy
MAIL_FROM_EMAIL=
MAIL_SECURE=false

# Uploads: choose one option
STORAGE_DRIVER=local
UPLOAD_DIR=uploads

# Or use S3 instead of local disk
# STORAGE_DRIVER=s3
# AWS_REGION=
# AWS_S3_BUCKET=
# AWS_S3_PUBLIC_BASE_URL=
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
```

### Email errors on server

If admission OTP or notification email returns `503 Email service is not configured on the server`, the production `.env.docker` file is missing one or more of:

- `MAIL_HOST`
- `MAIL_USER`
- `MAIL_PASS`

Copy the same SMTP values that work in your local `.env`.

### Image upload errors on server

If uploads return `500 Internal Server Error`:

- With `STORAGE_DRIVER=local`, ensure `BACKEND_PUBLIC_URL` is set and Nginx proxies `/uploads` to the API container.
- With `STORAGE_DRIVER=s3`, ensure `AWS_S3_BUCKET`, `AWS_REGION`, and credentials or IAM permissions are valid.

## Build and Start

```bash
docker compose -f docker-compose.prod.yml --env-file .env.docker build
docker compose -f docker-compose.prod.yml --env-file .env.docker up -d
```

Check status:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.docker ps
docker compose -f docker-compose.prod.yml --env-file .env.docker logs -f api
```

## Migrations and Catalog Sync

Run migrations and sync courses plus learning paths from the release machine. The production API container only ships compiled `dist` output, so run seeds from the repo checkout on the server host.

Option A: host machine with repo checkout

```bash
npm ci
cp .env.docker .env
# If Postgres is only reachable inside Docker, use DATABASE_HOST=postgres via the catalog-sync service below.
npm run seed:sync
```

Option B: one-off Docker sync service (recommended on server)

```bash
docker compose -f docker-compose.prod.yml --env-file .env.docker --profile tools run --rm catalog-sync
```

This command:

1. Runs pending migrations
2. Upserts all 23 published academy courses
3. Upserts all 6 learning paths with course mappings

After sync, verify in admin or PostgreSQL:

- Published courses: 23
- Learning paths: 6

## Frontend Deployment

In `systemgrid-academy-frontend`, set:

```bash
NEXT_PUBLIC_API_URL=https://api-academy.thesystemgrid.com/api/v1
NEXT_PUBLIC_SITE_URL=https://academy.thesystemgrid.com
```

If using S3 or CloudFront image hosts, also set:

```bash
NEXT_PUBLIC_S3_HOSTNAME=
NEXT_PUBLIC_CDN_HOSTNAME=
NEXT_PUBLIC_API_HOSTNAME=api-academy.thesystemgrid.com
```

Build and start the frontend with your process manager or hosting platform after pulling the latest GitHub code.

## Nginx Notes for Local Uploads

When `STORAGE_DRIVER=local`, uploaded files are served from the API at `/uploads/*`. Ensure your reverse proxy forwards that path to the backend, for example:

```nginx
location /uploads/ {
  proxy_pass http://127.0.0.1:5000/uploads/;
}
```

## Reports and Audit Endpoints

Protected admin endpoints:

```bash
GET /api/v1/admin/reports
GET /api/v1/admin/reports/admissions
GET /api/v1/admin/reports/fees
GET /api/v1/admin/reports/attendance
GET /api/v1/admin/reports/courses
GET /api/v1/admin/reports/course-performance
GET /api/v1/admin/audit-logs
GET /api/v1/admin/audit-logs/:id
```

## Security

The app includes:

- DTO validation with whitelist and forbidden unknown fields.
- Role guards and active-user guard.
- httpOnly refresh token cookie.
- Basic security headers.
- In-memory rate limiting for a single API instance.
- Sanitized audit log metadata.
- 500-level error logging without exposing stack traces in production.

For multi-instance production, move rate limiting to Redis, Nginx, or the edge provider.
