import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStudentLastIssuedPassword1783800000000 implements MigrationInterface {
  name = 'AddStudentLastIssuedPassword1783800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "student_profiles"
      ADD COLUMN "last_issued_password" varchar
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "student_profiles"
      DROP COLUMN "last_issued_password"
    `);
  }
}
