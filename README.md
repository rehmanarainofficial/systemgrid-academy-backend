# SystemGrid Academy API

NestJS backend for SystemGrid Academy.

## Local Setup

Install dependencies:

```bash
npm install
```

Create environment file:

```bash
copy .env.example .env
```

Start PostgreSQL in Docker:

```bash
npm run db:up
```

Start PostgreSQL with pgAdmin:

```bash
npm run db:up:tools
```

Run the API:

```bash
npm run start:dev
```

The API runs on `http://localhost:5000/api/v1` when `PORT=5000`.

## Database

Docker service:

- PostgreSQL: `localhost:5432`
- Database: `systemgrid_academy`
- User: `systemgrid`
- Password: `systemgrid_dev_password`
- Optional pgAdmin: `http://localhost:5050`

Useful commands:

```bash
npm run db:logs
npm run migration:run
npm run db:down
npm run seed
npm run seed:courses
npm run seed:blogs
```

`npm run seed` only bootstraps admin accounts, categories, and settings.  
Course catalog and outlines come from `npm run seed:courses`.  
Set passwords in `.env` before seeding (`SEED_ADMIN_PASSWORD`, `SUPERADMIN_PASSWORD`, `STAFF_PASSWORD`).

## Docker PostgreSQL Read Commands

Start the database:

```bash
docker compose up -d postgres
```

Check running containers:

```bash
docker ps
```

Open PostgreSQL inside the container:

```bash
docker exec -it systemgrid_academy_postgres psql -U systemgrid -d systemgrid_academy
```

Inside `psql`:

```sql
\l
\dt
SELECT id, name, email, role FROM users;
SELECT * FROM student_profiles;
SELECT id, name, slug FROM course_categories;
SELECT id, title, slug FROM courses;
SELECT * FROM batches;
SELECT * FROM enrollments;
SELECT * FROM attendance;
SELECT * FROM assignments;
SELECT * FROM assignment_submissions;
SELECT * FROM fee_plans;
SELECT * FROM payments;
SELECT * FROM invoices;
SELECT * FROM certificates;
SELECT * FROM leads;
SELECT * FROM notifications;
SELECT * FROM settings;
SELECT * FROM audit_logs;
\q
```

Keep `DATABASE_SYNCHRONIZE=false` outside local prototyping. Use TypeORM migrations for production schema changes.

## Auth and Admin Operations

Core auth endpoints:

```bash
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
GET  /api/v1/auth/me
```

`/auth/login` and `/auth/refresh` set `sg_refresh_token` as an httpOnly cookie and return the short-lived access token in the response for frontend state.

Admin operations added for Phase 1 backend coverage:

```bash
GET   /api/v1/admin/enrollments
POST  /api/v1/admin/enrollments
GET   /api/v1/admin/enrollments/:id
PATCH /api/v1/admin/enrollments/:id/status
POST  /api/v1/admin/uploads
```

Blog publishing endpoints:

```bash
GET    /api/v1/public/blog
GET    /api/v1/public/blog/:slug
GET    /api/v1/admin/blog
POST   /api/v1/admin/blog
PATCH  /api/v1/admin/blog/:id
PATCH  /api/v1/admin/blog/:id/publish
PATCH  /api/v1/admin/blog/:id/unpublish
DELETE /api/v1/admin/blog/:id
POST   /api/v1/admin/blog/upload-image
```

Only Admin and Super Admin roles can access blog management endpoints. Run `npm run migration:run` after deployment to create the `blog_posts` table. S3 setup and least-privilege IAM guidance are documented in `docs/S3_BLOG_STORAGE.md`.

Local password reset returns a `resetToken` in non-production mode so the flow can be tested before email integration. Production should send that token through the configured email provider instead of returning it in API responses.

## Production Docs

- Deployment: `docs/DEPLOYMENT.md`
- Backup strategy: `docs/BACKUP_STRATEGY.md`
- Production compose file: `docker-compose.prod.yml`
- Production image: `Dockerfile`
- S3 blog images: `docs/S3_BLOG_STORAGE.md`

## Public Phase 2 Endpoints

```bash
GET  /api/v1/public/courses
GET  /api/v1/public/courses/:slug
POST /api/v1/public/leads
POST /api/v1/public/demo-class
GET  /api/v1/student/dashboard
GET  /api/v1/student/my-courses
GET  /api/v1/student/my-courses/:courseId
```

Lead/demo payload:

```json
{
  "name": "Student Name",
  "phone": "03433xxxxxx",
  "email": "[EMAIL_ADDRESS]",
  "courseInterest": "Web Development",
  "message": "I want to join the next batch"
}
```
