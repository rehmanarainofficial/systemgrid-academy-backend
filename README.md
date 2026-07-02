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
npm run db:down
npm run seed
```

Student seed login:

```bash
email: student@systemgrid.academy
password: Student@123
```

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
\c systemgrid_academy
\dt
\d users
SELECT id, name, email, role FROM users;
SELECT id, title, slug FROM courses;
SELECT * FROM enrollments;
SELECT * FROM attendance;
SELECT * FROM fee_plans;
\q
```

Keep `DATABASE_SYNCHRONIZE=false` outside local prototyping. Use TypeORM migrations for production schema changes.

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
  "phone": "+923000000000",
  "email": "student@example.com",
  "courseInterest": "Web Development",
  "message": "I want to join the next batch"
}
```
