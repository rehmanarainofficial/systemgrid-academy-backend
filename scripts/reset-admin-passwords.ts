import 'reflect-metadata';
import { config } from 'dotenv';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { academyEntities, User } from '../src/database/entities';

config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? 5432),
  username: process.env.DATABASE_USERNAME ?? process.env.DATABASE_USER ?? 'postgres',
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME ?? 'systemgrid_academy',
  entities: academyEntities,
  synchronize: false,
});

const targets = [
  { email: 'superadmin@systemgrid.academy', env: 'SUPERADMIN_PASSWORD' },
  { email: 'admin@systemgrid.academy', env: 'ADMIN_PASSWORD' },
  { email: process.env.SEED_ADMIN_EMAIL ?? 'admin@systemgrid.academy', env: 'SEED_ADMIN_PASSWORD' },
  { email: 'staff@systemgrid.academy', env: 'STAFF_PASSWORD' },
] as const;

async function main() {
  const uniqueTargets = new Map<string, string>();
  for (const target of targets) {
    const password = process.env[target.env]?.trim();
    if (!password) continue;
    uniqueTargets.set(target.email.toLowerCase(), password);
  }

  if (!uniqueTargets.size) {
    throw new Error(
      'Set at least one password env var: SUPERADMIN_PASSWORD, ADMIN_PASSWORD, SEED_ADMIN_PASSWORD, STAFF_PASSWORD',
    );
  }

  await dataSource.initialize();
  const users = dataSource.getRepository(User);

  for (const [email, password] of uniqueTargets) {
    const user = await users.findOne({ where: { email } });
    if (!user) {
      console.warn(`Skipped missing user: ${email}`);
      continue;
    }
    user.password = await bcrypt.hash(password, 12);
    await users.save(user);
    console.log(`Updated password for ${email}`);
  }

  await dataSource.destroy();
}

main().catch(async (error) => {
  console.error(error);
  await dataSource.destroy().catch(() => undefined);
  process.exit(1);
});
