import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCourseTechStack1783080000000 implements MigrationInterface {
  name = 'AddCourseTechStack1783080000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "tech_stack" text');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "courses" DROP COLUMN IF EXISTS "tech_stack"');
  }
}
