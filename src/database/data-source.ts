import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { academyEntities } from './entities';

config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? 5432),
  username: process.env.DATABASE_USERNAME ?? process.env.DATABASE_USER ?? 'systemgrid',
  password: process.env.DATABASE_PASSWORD ?? 'systemgrid_dev_password',
  database: process.env.DATABASE_NAME ?? 'systemgrid_academy',
  entities: academyEntities,
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
