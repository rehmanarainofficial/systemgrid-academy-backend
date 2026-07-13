import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '../../common/enums/user-role.enum';
import { academyEntities, AuditLog, CourseCategory, Setting, User } from '../entities';

config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? 5432),
  username: process.env.DATABASE_USERNAME ?? process.env.DATABASE_USER ?? 'systemgrid',
  password: process.env.DATABASE_PASSWORD ?? 'systemgrid_dev_password',
  database: process.env.DATABASE_NAME ?? 'systemgrid_academy',
  entities: academyEntities,
  synchronize: false,
});

const categoryNames = [
  'Web Development',
  'App Development',
  'Desktop App Development',
  'Graphic Designing',
  'English for IT',
  'AI and Automation',
  'Data',
  'Development',
  'Design',
  'Marketing',
  'Cybersecurity',
  'Programming',
  'Languages',
  'Test Preparation',
  'Freelancing',
] as const;

function resolveSeedPassword(key: string, devFallback?: string) {
  const value = process.env[key]?.trim();
  if (value) return value;
  if (process.env.NODE_ENV !== 'production' && devFallback) return devFallback;
  throw new Error(`${key} is required for seeding`);
}

async function seed() {
  await dataSource.initialize();
  const users = dataSource.getRepository(User);
  const categories = dataSource.getRepository(CourseCategory);
  const settings = dataSource.getRepository(Setting);
  const auditLogs = dataSource.getRepository(AuditLog);

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@systemgrid.academy';
  const adminPassword = resolveSeedPassword('SEED_ADMIN_PASSWORD', 'ChangeMe123!');
  const existingAdmin = await users.findOne({ where: { email: adminEmail } });
  await users.save(
    existingAdmin
      ? users.merge(existingAdmin, {
          name: process.env.SEED_ADMIN_NAME ?? 'SystemGrid Admin',
          password: await bcrypt.hash(adminPassword, 12),
          role: UserRole.Admin,
          isActive: true,
        })
      : users.create({
          name: process.env.SEED_ADMIN_NAME ?? 'SystemGrid Admin',
          email: adminEmail,
          password: await bcrypt.hash(adminPassword, 12),
          role: UserRole.Admin,
          isActive: true,
        }),
  );

  for (const account of [
    {
      name: 'SystemGrid Super Admin',
      email: 'superadmin@systemgrid.academy',
      passwordEnv: 'SUPERADMIN_PASSWORD',
      devFallback: 'ChangeMe123!',
      role: UserRole.SuperAdmin,
    },
    {
      name: 'Admissions Staff',
      email: 'staff@systemgrid.academy',
      passwordEnv: 'STAFF_PASSWORD',
      devFallback: 'ChangeMe123!',
      role: UserRole.Staff,
    },
  ]) {
    const existing = await users.findOne({ where: { email: account.email } });
    const password = resolveSeedPassword(account.passwordEnv, account.devFallback);
    await users.save(
      existing
        ? users.merge(existing, {
            name: account.name,
            password: await bcrypt.hash(password, 12),
            role: account.role,
            isActive: true,
          })
        : users.create({
            name: account.name,
            email: account.email,
            password: await bcrypt.hash(password, 12),
            role: account.role,
            isActive: true,
          }),
    );
  }

  for (const [index, name] of categoryNames.entries()) {
    const slug = name.toLowerCase().replaceAll(' ', '-');
    const existingCategory = await categories.findOne({ where: { slug } });
    if (!existingCategory) {
      await categories.save(
        categories.create({
          name,
          slug,
          description: `${name} courses by SystemGrid Academy`,
          sortOrder: index + 1,
        }),
      );
    }
  }

  const settingSeeds = [
    {
      key: 'branding',
      value: {
        academyName: 'SystemGrid Academy',
        tagline: 'Practical IT Training by SystemGrid',
        logoUrl: '/logo.svg',
      },
    },
    {
      key: 'contact',
      value: {
        supportEmail: 'support@thesystemgrid.com',
        academyEmail: 'academy@thesystemgrid.com',
        city: 'Karachi',
        website: 'https://academy.thesystemgrid.com',
      },
    },
    {
      key: 'theme',
      value: {
        defaultTheme: 'light',
        primaryColor: '#007AFF',
        accentColor: '#0EA5E9',
      },
    },
    {
      key: 'whatsapp',
      value: {
        number: '923433133834',
        enabled: true,
        message: 'Assalam o Alaikum, I want to know more about SystemGrid Academy.',
      },
    },
  ] as const;

  for (const settingSeed of settingSeeds) {
    const existingSetting = await settings.findOne({ where: { key: settingSeed.key } });
    await settings.save(
      existingSetting
        ? settings.merge(existingSetting, { value: settingSeed.value })
        : settings.create(settingSeed),
    );
  }

  const superAdmin = await users.findOne({ where: { email: 'superadmin@systemgrid.academy' } });
  const existingAudit = await auditLogs.findOne({
    where: { module: 'seed', action: 'seed_database', recordId: 'systemgrid-academy' },
  });
  if (!existingAudit) {
    await auditLogs.save(
      auditLogs.create({
        user: superAdmin ?? undefined,
        action: 'seed_database',
        module: 'seed',
        recordId: 'systemgrid-academy',
        metadata: { categories: categoryNames.length, mode: 'bootstrap-only' },
      }),
    );
  }

  await dataSource.destroy();
  console.log('Bootstrap seed complete. Run npm run seed:courses for published course catalog.');
}

seed().catch(async (error) => {
  console.error(error);
  await dataSource.destroy();
  process.exit(1);
});
