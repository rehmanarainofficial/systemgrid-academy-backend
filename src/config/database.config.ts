import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? 5432),
  username:
    process.env.DATABASE_USERNAME ?? process.env.DATABASE_USER ?? 'systemgrid',
  password: process.env.DATABASE_PASSWORD ?? 'systemgrid',
  database: process.env.DATABASE_NAME ?? 'systemgrid_academy',
  synchronize:
    process.env.NODE_ENV !== 'production' &&
    process.env.DATABASE_SYNCHRONIZE === 'true',
}));
