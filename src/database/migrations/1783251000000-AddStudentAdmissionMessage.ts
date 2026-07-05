import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStudentAdmissionMessage1783251000000
  implements MigrationInterface
{
  name = 'AddStudentAdmissionMessage1783251000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "student_profiles"
        ADD COLUMN IF NOT EXISTS "admission_message" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "student_profiles"
        DROP COLUMN IF EXISTS "admission_message"
    `);
  }
}
