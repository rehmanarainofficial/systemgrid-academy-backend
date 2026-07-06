import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStudentProfileEmailVerification1783351000000
  implements MigrationInterface
{
  name = 'AddStudentProfileEmailVerification1783351000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "student_profiles"
        ADD COLUMN IF NOT EXISTS "email_verified" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "email_verified_at" timestamptz
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "student_profiles"
        DROP COLUMN IF EXISTS "email_verified_at",
        DROP COLUMN IF EXISTS "email_verified"
    `);
  }
}
