import { MigrationInterface, QueryRunner } from 'typeorm';

export class StudentFeeScheduleFields1783900000000 implements MigrationInterface {
  name = 'StudentFeeScheduleFields1783900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "student_profiles"
      ADD COLUMN IF NOT EXISTS "portal_access_suspended" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "portal_suspended_reason" text,
      ADD COLUMN IF NOT EXISTS "portal_suspended_at" TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS "fee_popup_dismissed_until" date
    `);

    await queryRunner.query(`
      ALTER TABLE "fee_plans"
      ADD COLUMN IF NOT EXISTS "installments_paid" integer NOT NULL DEFAULT 1,
      ADD COLUMN IF NOT EXISTS "last_fee_reminder_sent_at" date
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "fee_plans"
      DROP COLUMN IF EXISTS "last_fee_reminder_sent_at",
      DROP COLUMN IF EXISTS "installments_paid"
    `);

    await queryRunner.query(`
      ALTER TABLE "student_profiles"
      DROP COLUMN IF EXISTS "fee_popup_dismissed_until",
      DROP COLUMN IF EXISTS "portal_suspended_at",
      DROP COLUMN IF EXISTS "portal_suspended_reason",
      DROP COLUMN IF EXISTS "portal_access_suspended"
    `);
  }
}
