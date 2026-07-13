import { MigrationInterface, QueryRunner } from 'typeorm';

export class InstructorShowOnWebsite1784000000000 implements MigrationInterface {
  name = 'InstructorShowOnWebsite1784000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "instructors"
        ADD COLUMN IF NOT EXISTS "show_on_website" boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_instructors_show_on_website" ON "instructors" ("show_on_website")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "idx_instructors_show_on_website"');
    await queryRunner.query(`
      ALTER TABLE "instructors"
        DROP COLUMN IF EXISTS "show_on_website"
    `);
  }
}
