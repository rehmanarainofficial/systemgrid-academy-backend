import { MigrationInterface, QueryRunner } from 'typeorm';

export class CourseDisplayOrder1784100000000 implements MigrationInterface {
  name = 'CourseDisplayOrder1784100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "courses"
        ADD COLUMN IF NOT EXISTS "display_order" integer NOT NULL DEFAULT 0
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_courses_display_order" ON "courses" ("display_order")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "idx_courses_display_order"');
    await queryRunner.query(`
      ALTER TABLE "courses"
        DROP COLUMN IF EXISTS "display_order"
    `);
  }
}
