import 'dotenv/config';
import { DataSource } from 'typeorm';
import { academyEntities } from '../src/database/entities';
import { Course } from '../src/database/entities';

async function main() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT ?? 5432),
    username: process.env.DATABASE_USERNAME ?? process.env.DATABASE_USER ?? 'systemgrid',
    password: process.env.DATABASE_PASSWORD ?? 'systemgrid_dev_password',
    database: process.env.DATABASE_NAME ?? 'systemgrid_academy',
    entities: academyEntities,
    synchronize: false,
  });

  await ds.initialize();
  const courses = await ds.getRepository(Course).find({
    relations: ['category'],
    order: { title: 'ASC' },
  });

  console.log(`TOTAL_COURSES=${courses.length}`);
  for (const course of courses) {
    console.log(
      `${course.isPublished ? 'PUB' : 'UNP'} | ${course.slug} | ${course.title} | ${course.category?.name ?? ''}`,
    );
  }

  const duplicateTitles = await ds.query(`
    SELECT LOWER(title) AS title, COUNT(*)::int AS cnt, array_agg(slug ORDER BY slug) AS slugs
    FROM courses
    GROUP BY LOWER(title)
    HAVING COUNT(*) > 1
    ORDER BY cnt DESC
  `);
  console.log('DUPLICATE_TITLES=' + JSON.stringify(duplicateTitles));

  const similar = await ds.query(`
    SELECT slug, title
    FROM courses
    WHERE LOWER(title) LIKE '%django%'
       OR LOWER(title) LIKE '%mern%'
       OR LOWER(title) LIKE '%mean%'
       OR LOWER(title) LIKE '%free%launch%'
       OR LOWER(slug) LIKE '%django%'
       OR LOWER(slug) LIKE '%mern%'
       OR LOWER(slug) LIKE '%mean%'
       OR LOWER(slug) LIKE '%free%'
    ORDER BY title
  `);
  console.log('STACK_AND_FREE=' + JSON.stringify(similar, null, 2));

  await ds.destroy();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
