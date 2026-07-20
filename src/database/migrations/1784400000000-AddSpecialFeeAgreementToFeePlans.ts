import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSpecialFeeAgreementToFeePlans1784400000000
  implements MigrationInterface
{
  name = 'AddSpecialFeeAgreementToFeePlans1784400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "fee_plans"
        ADD COLUMN IF NOT EXISTS "has_special_fee_agreement" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "standard_monthly_fee" numeric(12,2),
        ADD COLUMN IF NOT EXISTS "agreed_monthly_fee" numeric(12,2),
        ADD COLUMN IF NOT EXISTS "special_fee_discount_per_month" numeric(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "special_fee_reason" varchar,
        ADD COLUMN IF NOT EXISTS "special_fee_notes" text,
        ADD COLUMN IF NOT EXISTS "special_fee_approved_by_id" uuid,
        ADD COLUMN IF NOT EXISTS "special_fee_approved_at" TIMESTAMP WITH TIME ZONE
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_fee_plans_special_fee_approved_by'
        ) THEN
          ALTER TABLE "fee_plans"
          ADD CONSTRAINT "FK_fee_plans_special_fee_approved_by"
          FOREIGN KEY ("special_fee_approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL;
        END IF;
      END$$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "fee_plans" DROP CONSTRAINT IF EXISTS "FK_fee_plans_special_fee_approved_by"',
    );
    await queryRunner.query(`
      ALTER TABLE "fee_plans"
        DROP COLUMN IF EXISTS "special_fee_approved_at",
        DROP COLUMN IF EXISTS "special_fee_approved_by_id",
        DROP COLUMN IF EXISTS "special_fee_notes",
        DROP COLUMN IF EXISTS "special_fee_reason",
        DROP COLUMN IF EXISTS "special_fee_discount_per_month",
        DROP COLUMN IF EXISTS "agreed_monthly_fee",
        DROP COLUMN IF EXISTS "standard_monthly_fee",
        DROP COLUMN IF EXISTS "has_special_fee_agreement"
    `);
  }
}
