import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AdminLearningManagementFields1783078000000 implements MigrationInterface {
  name = 'AdminLearningManagementFields1783078000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['course_categories', 'course_modules', 'lessons', 'instructors', 'batches']) {
      await queryRunner.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
      await queryRunner.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
    }
    await queryRunner.query('ALTER TABLE "batches" ADD COLUMN IF NOT EXISTS "meetingUrl" character varying');
    await queryRunner.query('ALTER TABLE "batches" ADD COLUMN IF NOT EXISTS "location" character varying');
    await queryRunner.query('ALTER TABLE "batches" ADD COLUMN IF NOT EXISTS "enrollmentNote" text');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "batches" DROP COLUMN IF EXISTS "enrollmentNote"');
    await queryRunner.query('ALTER TABLE "batches" DROP COLUMN IF EXISTS "location"');
    await queryRunner.query('ALTER TABLE "batches" DROP COLUMN IF EXISTS "meetingUrl"');
    for (const table of ['batches', 'instructors', 'lessons', 'course_modules', 'course_categories']) {
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "updatedAt"`);
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "createdAt"`);
    }
  }
}
