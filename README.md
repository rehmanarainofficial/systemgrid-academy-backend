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

The API runs on `http://localhost:4000/api/v1`.

## Database

Docker service:

- PostgreSQL: `localhost:5432`
- Database: `systemgrid_academy`
- User: `systemgrid`
- Password: `systemgrid`
- Optional pgAdmin: `http://localhost:5050`

Useful commands:

```bash
npm run db:logs
npm run db:down
npm run seed
```

Keep `DATABASE_SYNCHRONIZE=false` outside local prototyping. Use TypeORM migrations for production schema changes.

## Public Phase 2 Endpoints

```bash
GET  /api/v1/public/courses
GET  /api/v1/public/courses/:slug
POST /api/v1/public/leads
POST /api/v1/public/demo-class
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
