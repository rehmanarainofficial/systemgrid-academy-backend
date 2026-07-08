import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStudentPasswordTracking1783500000000 implements MigrationInterface {
  name = 'AddStudentPasswordTracking1783500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "student_profiles"
      ADD COLUMN "password_sent" boolean DEFAULT false,
      ADD COLUMN "password_sent_at" timestamptz,
      ADD COLUMN "password_last_changed" timestamptz
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "student_profiles"
      DROP COLUMN "password_last_changed",
      DROP COLUMN "password_sent_at",
      DROP COLUMN "password_sent"
    `);
  }
}
