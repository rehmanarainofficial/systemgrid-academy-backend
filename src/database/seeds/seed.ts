import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '../../common/enums/user-role.enum';
import { academyEntities, Course, CourseCategory, User } from '../entities';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? 5432),
  username: process.env.DATABASE_USER ?? 'systemgrid',
  password: process.env.DATABASE_PASSWORD ?? 'systemgrid',
  database: process.env.DATABASE_NAME ?? 'systemgrid_academy',
  entities: academyEntities,
  synchronize: false,
});

async function seed() {
  await dataSource.initialize();
  const users = dataSource.getRepository(User);
  const categories = dataSource.getRepository(CourseCategory);
  const courses = dataSource.getRepository(Course);

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@systemgrid.academy';
  const existingAdmin = await users.findOne({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await users.save(
      users.create({
        name: process.env.SEED_ADMIN_NAME ?? 'SystemGrid Super Admin',
        email: adminEmail,
        password: await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!', 12),
        role: UserRole.SuperAdmin,
        isActive: true,
      }),
    );
  }

  const categoryNames = ['Web Development', 'App Development', 'Graphic Designing', 'English for IT'];
  for (const [index, name] of categoryNames.entries()) {
    const slug = name.toLowerCase().replaceAll(' ', '-');
    let category = await categories.findOne({ where: { slug } });
    if (!category) {
      category = await categories.save(
        categories.create({
          name,
          slug,
          description: `${name} courses by SystemGrid Academy`,
          sortOrder: index + 1,
        }),
      );
    }

    const sampleSlug = `${slug}-foundation`;
    const existingCourse = await courses.findOne({ where: { slug: sampleSlug } });
    if (!existingCourse) {
      await courses.save(
        courses.create({
          category,
          title: `${name} Foundation`,
          slug: sampleSlug,
          shortDescription: `Beginner-friendly ${name.toLowerCase()} course with practical projects.`,
          duration: 12,
          durationUnit: 'weeks',
          mode: 'hybrid',
          language: 'mixed',
          fee: 25000,
          discountFee: 20000,
          isFeatured: index < 2,
          isPublished: true,
        }),
      );
    }
  }

  await dataSource.destroy();
}

seed().catch(async (error) => {
  console.error(error);
  await dataSource.destroy();
  process.exit(1);
});
