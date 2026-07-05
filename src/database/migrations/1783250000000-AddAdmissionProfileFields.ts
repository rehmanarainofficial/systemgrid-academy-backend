import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdmissionProfileFields1783250000000
  implements MigrationInterface
{
  name = 'AddAdmissionProfileFields1783250000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."leads_gender_enum" AS ENUM(
          'male',
          'female',
          'prefer_not_to_say'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$
    `);
    await queryRunner.query(`
      ALTER TABLE "leads"
        ADD COLUMN IF NOT EXISTS "guardian_name" character varying,
        ADD COLUMN IF NOT EXISTS "guardian_phone" character varying,
        ADD COLUMN IF NOT EXISTS "date_of_birth" date,
        ADD COLUMN IF NOT EXISTS "gender" "public"."leads_gender_enum",
        ADD COLUMN IF NOT EXISTS "address" character varying,
        ADD COLUMN IF NOT EXISTS "preferred_days" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "student_profiles"
        ADD COLUMN IF NOT EXISTS "course_interest" character varying,
        ADD COLUMN IF NOT EXISTS "preferred_mode" character varying,
        ADD COLUMN IF NOT EXISTS "preferred_timing" character varying,
        ADD COLUMN IF NOT EXISTS "preferred_days" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "student_profiles"
        DROP COLUMN IF EXISTS "preferred_days",
        DROP COLUMN IF EXISTS "preferred_timing",
        DROP COLUMN IF EXISTS "preferred_mode",
        DROP COLUMN IF EXISTS "course_interest"
    `);
    await queryRunner.query(`
      ALTER TABLE "leads"
        DROP COLUMN IF EXISTS "preferred_days",
        DROP COLUMN IF EXISTS "address",
        DROP COLUMN IF EXISTS "gender",
        DROP COLUMN IF EXISTS "date_of_birth",
        DROP COLUMN IF EXISTS "guardian_phone",
        DROP COLUMN IF EXISTS "guardian_name"
    `);
    await queryRunner.query('DROP TYPE IF EXISTS "public"."leads_gender_enum"');
  }
}
