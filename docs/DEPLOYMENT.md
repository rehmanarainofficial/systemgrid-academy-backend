# SystemGrid Academy Backend Deployment

## Production Checklist

- Use `NODE_ENV=production`.
- Keep `DATABASE_SYNCHRONIZE=false`.
- Use long random values for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `JWT_RESET_SECRET`.
- Set `FRONTEND_URL` to the deployed frontend origin, for example `https://academy.thesystemgrid.com`.
- Keep PostgreSQL behind the Docker network or a private firewall.
- Run migrations before deploying a new app version.
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
```

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

## Migrations

Run migrations from the release machine before starting the new API version:

```bash
npm ci
cp .env.docker .env
npm run migration:run
```

Production migration rule: do not enable TypeORM `synchronize`.

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
