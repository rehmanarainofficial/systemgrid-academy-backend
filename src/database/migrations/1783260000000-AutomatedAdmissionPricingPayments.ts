import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutomatedAdmissionPricingPayments1783260000000
  implements MigrationInterface
{
  name = 'AutomatedAdmissionPricingPayments1783260000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notifications_type_enum') THEN
          ALTER TYPE "public"."notifications_type_enum" ADD VALUE IF NOT EXISTS 'referral';
          ALTER TYPE "public"."notifications_type_enum" ADD VALUE IF NOT EXISTS 'wallet';
          ALTER TYPE "public"."notifications_type_enum" ADD VALUE IF NOT EXISTS 'scholarship';
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "courses"
        ADD COLUMN IF NOT EXISTS "monthly_fee" numeric(12,2) NOT NULL DEFAULT 5000
    `);

    await queryRunner.query(`
      ALTER TABLE "fee_plans"
        ADD COLUMN IF NOT EXISTS "student_id" uuid,
        ADD COLUMN IF NOT EXISTS "course_id" uuid,
        ADD COLUMN IF NOT EXISTS "pricing_type" character varying,
        ADD COLUMN IF NOT EXISTS "course_duration_months" integer NOT NULL DEFAULT 1,
        ADD COLUMN IF NOT EXISTS "base_monthly_fee" numeric(12,2) NOT NULL DEFAULT 5000,
        ADD COLUMN IF NOT EXISTS "discount_percentage" numeric(5,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "referral_coupon_discount_amount" numeric(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "scholarship_discount_amount" numeric(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "wallet_credit_used" numeric(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "billing_cycle" character varying,
        ADD COLUMN IF NOT EXISTS "next_due_date" date
    `);

    await queryRunner.query(`
      UPDATE "fee_plans" fee
      SET "student_id" = enrollment."student_id",
          "course_id" = enrollment."course_id"
      FROM "enrollments" enrollment
      WHERE fee."enrollment_id" = enrollment."id"
        AND (fee."student_id" IS NULL OR fee."course_id" IS NULL)
    `);

    await queryRunner.query(`
      ALTER TABLE "payments"
        ADD COLUMN IF NOT EXISTS "invoice_id" uuid,
        ADD COLUMN IF NOT EXISTS "payment_intent_id" uuid,
        ADD COLUMN IF NOT EXISTS "gateway" character varying,
        ADD COLUMN IF NOT EXISTS "gateway_reference" character varying,
        ADD COLUMN IF NOT EXISTS "raw_gateway_response" jsonb
    `);

    await queryRunner.query(`
      ALTER TABLE "invoices"
        ALTER COLUMN "payment_id" DROP NOT NULL,
        ADD COLUMN IF NOT EXISTS "admission_application_id" uuid,
        ADD COLUMN IF NOT EXISTS "student_id" uuid,
        ADD COLUMN IF NOT EXISTS "enrollment_id" uuid,
        ADD COLUMN IF NOT EXISTS "fee_plan_id" uuid,
        ADD COLUMN IF NOT EXISTS "pricing_plan_type" character varying,
        ADD COLUMN IF NOT EXISTS "gross_amount" numeric(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "plan_discount_amount" numeric(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "referral_coupon_discount_amount" numeric(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "scholarship_discount_amount" numeric(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "wallet_credit_used" numeric(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "payable_amount" numeric(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "paid_amount" numeric(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "pending_amount" numeric(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "due_date" date,
        ADD COLUMN IF NOT EXISTS "paid_at" timestamptz
    `);

    await queryRunner.query(`
      UPDATE "invoices"
      SET "gross_amount" = CASE WHEN "gross_amount" = 0 THEN "amount" ELSE "gross_amount" END,
          "payable_amount" = CASE WHEN "payable_amount" = 0 THEN "amount" ELSE "payable_amount" END,
          "paid_amount" = CASE WHEN "status" = 'paid' AND "paid_amount" = 0 THEN "amount" ELSE "paid_amount" END,
          "pending_amount" = CASE WHEN "status" = 'paid' THEN 0 WHEN "pending_amount" = 0 THEN "amount" ELSE "pending_amount" END,
          "paid_at" = CASE WHEN "status" = 'paid' AND "paid_at" IS NULL THEN "issued_at" ELSE "paid_at" END
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admission_applications" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" character varying,
        "email" character varying NOT NULL,
        "phone" character varying,
        "guardian_name" character varying,
        "guardian_phone" character varying,
        "city" character varying,
        "address" text,
        "date_of_birth" date,
        "gender" character varying,
        "education_level" character varying,
        "course_id" uuid,
        "batch_id" uuid,
        "preferred_mode" character varying,
        "preferred_timing" character varying,
        "preferred_days" character varying,
        "pricing_plan_type" character varying,
        "referral_code_applied" character varying,
        "referral_discount_amount" numeric(12,2) NOT NULL DEFAULT 0,
        "gross_amount" numeric(12,2) NOT NULL DEFAULT 0,
        "plan_discount_amount" numeric(12,2) NOT NULL DEFAULT 0,
        "scholarship_discount_amount" numeric(12,2) NOT NULL DEFAULT 0,
        "final_payable_amount" numeric(12,2) NOT NULL DEFAULT 0,
        "status" character varying NOT NULL DEFAULT 'email_pending',
        "email_verified" boolean NOT NULL DEFAULT false,
        "email_otp_hash" character varying,
        "email_otp_expires_at" timestamptz,
        "email_otp_sent_at" timestamptz,
        "email_otp_attempts" integer NOT NULL DEFAULT 0,
        "email_verified_at" timestamptz,
        "message" text,
        "assigned_to_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "chk_admission_application_amounts" CHECK ("gross_amount" >= 0 AND "plan_discount_amount" >= 0 AND "referral_discount_amount" >= 0 AND "scholarship_discount_amount" >= 0 AND "final_payable_amount" >= 0)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment_intents" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "admission_application_id" uuid NOT NULL,
        "student_id" uuid,
        "invoice_id" uuid NOT NULL,
        "fee_plan_id" uuid,
        "gateway" character varying NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        "currency" character varying NOT NULL DEFAULT 'PKR',
        "status" character varying NOT NULL DEFAULT 'created',
        "gateway_reference" character varying,
        "merchant_transaction_id" character varying NOT NULL UNIQUE,
        "redirect_url" character varying,
        "callback_payload" jsonb,
        "verified_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "chk_payment_intents_amount_non_negative" CHECK ("amount" >= 0)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "student_wallets" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "student_id" uuid NOT NULL UNIQUE,
        "balance" numeric(12,2) NOT NULL DEFAULT 0,
        "total_earned" numeric(12,2) NOT NULL DEFAULT 0,
        "total_used" numeric(12,2) NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "chk_student_wallets_non_negative" CHECK ("balance" >= 0 AND "total_earned" >= 0 AND "total_used" >= 0)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "referral_codes" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "student_id" uuid NOT NULL,
        "code" character varying NOT NULL UNIQUE,
        "is_active" boolean NOT NULL DEFAULT true,
        "total_uses" integer NOT NULL DEFAULT 0,
        "total_verified_uses" integer NOT NULL DEFAULT 0,
        "total_credit_earned" numeric(12,2) NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "referral_redemptions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "referral_code_id" uuid NOT NULL,
        "referrer_student_id" uuid NOT NULL,
        "referred_application_id" uuid NOT NULL,
        "referred_student_id" uuid,
        "status" character varying NOT NULL DEFAULT 'applied',
        "referred_student_discount_amount" numeric(12,2) NOT NULL DEFAULT 500,
        "referrer_credit_amount" numeric(12,2) NOT NULL DEFAULT 1000,
        "verified_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "wallet_ledger" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "student_id" uuid NOT NULL,
        "type" character varying NOT NULL,
        "source" character varying NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        "balance_after" numeric(12,2) NOT NULL,
        "reference_id" character varying,
        "description" text,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "scholarship_tests" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "student_id" uuid NOT NULL,
        "course_id" uuid NOT NULL,
        "enrollment_id" uuid NOT NULL,
        "quarter_number" integer NOT NULL,
        "score_percentage" numeric(5,2) NOT NULL,
        "status" character varying NOT NULL DEFAULT 'failed',
        "discount_percentage" numeric(5,2) NOT NULL DEFAULT 0,
        "valid_from" date,
        "valid_until" date,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "offers" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "slug" character varying NOT NULL UNIQUE,
        "description" text,
        "type" character varying NOT NULL,
        "discount_percentage" numeric(5,2) NOT NULL DEFAULT 0,
        "discount_amount" numeric(12,2) NOT NULL DEFAULT 0,
        "applies_to" character varying,
        "min_course_duration_months" integer,
        "is_active" boolean NOT NULL DEFAULT true,
        "start_date" date,
        "end_date" date,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await this.addForeignKeyIfMissing(queryRunner, 'fee_plans', 'fk_fee_plans_student_id', 'student_id', 'student_profiles', 'id', 'CASCADE');
    await this.addForeignKeyIfMissing(queryRunner, 'fee_plans', 'fk_fee_plans_course_id', 'course_id', 'courses', 'id', 'RESTRICT');
    await this.addForeignKeyIfMissing(queryRunner, 'admission_applications', 'fk_admission_applications_course_id', 'course_id', 'courses', 'id', 'RESTRICT');
    await this.addForeignKeyIfMissing(queryRunner, 'admission_applications', 'fk_admission_applications_batch_id', 'batch_id', 'batches', 'id', 'SET NULL');
    await this.addForeignKeyIfMissing(queryRunner, 'admission_applications', 'fk_admission_applications_assigned_to_id', 'assigned_to_id', 'users', 'id', 'SET NULL');
    await this.addForeignKeyIfMissing(queryRunner, 'invoices', 'fk_invoices_admission_application_id', 'admission_application_id', 'admission_applications', 'id', 'SET NULL');
    await this.addForeignKeyIfMissing(queryRunner, 'invoices', 'fk_invoices_student_id', 'student_id', 'student_profiles', 'id', 'SET NULL');
    await this.addForeignKeyIfMissing(queryRunner, 'invoices', 'fk_invoices_enrollment_id', 'enrollment_id', 'enrollments', 'id', 'SET NULL');
    await this.addForeignKeyIfMissing(queryRunner, 'invoices', 'fk_invoices_fee_plan_id', 'fee_plan_id', 'fee_plans', 'id', 'SET NULL');
    await this.addForeignKeyIfMissing(queryRunner, 'payment_intents', 'fk_payment_intents_admission_application_id', 'admission_application_id', 'admission_applications', 'id', 'CASCADE');
    await this.addForeignKeyIfMissing(queryRunner, 'payment_intents', 'fk_payment_intents_student_id', 'student_id', 'student_profiles', 'id', 'SET NULL');
    await this.addForeignKeyIfMissing(queryRunner, 'payment_intents', 'fk_payment_intents_invoice_id', 'invoice_id', 'invoices', 'id', 'RESTRICT');
    await this.addForeignKeyIfMissing(queryRunner, 'payment_intents', 'fk_payment_intents_fee_plan_id', 'fee_plan_id', 'fee_plans', 'id', 'SET NULL');
    await this.addForeignKeyIfMissing(queryRunner, 'payments', 'fk_payments_invoice_id', 'invoice_id', 'invoices', 'id', 'RESTRICT');
    await this.addForeignKeyIfMissing(queryRunner, 'payments', 'fk_payments_payment_intent_id', 'payment_intent_id', 'payment_intents', 'id', 'SET NULL');
    await this.addForeignKeyIfMissing(queryRunner, 'student_wallets', 'fk_student_wallets_student_id', 'student_id', 'student_profiles', 'id', 'CASCADE');
    await this.addForeignKeyIfMissing(queryRunner, 'referral_codes', 'fk_referral_codes_student_id', 'student_id', 'student_profiles', 'id', 'CASCADE');
    await this.addForeignKeyIfMissing(queryRunner, 'referral_redemptions', 'fk_referral_redemptions_referral_code_id', 'referral_code_id', 'referral_codes', 'id', 'RESTRICT');
    await this.addForeignKeyIfMissing(queryRunner, 'referral_redemptions', 'fk_referral_redemptions_referrer_student_id', 'referrer_student_id', 'student_profiles', 'id', 'RESTRICT');
    await this.addForeignKeyIfMissing(queryRunner, 'referral_redemptions', 'fk_referral_redemptions_referred_application_id', 'referred_application_id', 'admission_applications', 'id', 'CASCADE');
    await this.addForeignKeyIfMissing(queryRunner, 'referral_redemptions', 'fk_referral_redemptions_referred_student_id', 'referred_student_id', 'student_profiles', 'id', 'SET NULL');
    await this.addForeignKeyIfMissing(queryRunner, 'wallet_ledger', 'fk_wallet_ledger_student_id', 'student_id', 'student_profiles', 'id', 'CASCADE');
    await this.addForeignKeyIfMissing(queryRunner, 'scholarship_tests', 'fk_scholarship_tests_student_id', 'student_id', 'student_profiles', 'id', 'CASCADE');
    await this.addForeignKeyIfMissing(queryRunner, 'scholarship_tests', 'fk_scholarship_tests_course_id', 'course_id', 'courses', 'id', 'CASCADE');
    await this.addForeignKeyIfMissing(queryRunner, 'scholarship_tests', 'fk_scholarship_tests_enrollment_id', 'enrollment_id', 'enrollments', 'id', 'CASCADE');

    const indexes = [
      ['idx_admission_applications_email', 'admission_applications', 'email'],
      ['idx_admission_applications_status', 'admission_applications', 'status'],
      ['idx_admission_applications_course_id', 'admission_applications', 'course_id'],
      ['idx_payment_intents_status', 'payment_intents', 'status'],
      ['idx_payment_intents_admission_application_id', 'payment_intents', 'admission_application_id'],
      ['idx_referral_codes_student_id', 'referral_codes', 'student_id'],
      ['idx_referral_redemptions_status', 'referral_redemptions', 'status'],
      ['idx_referral_redemptions_application_id', 'referral_redemptions', 'referred_application_id'],
      ['idx_student_wallets_student_id', 'student_wallets', 'student_id'],
      ['idx_wallet_ledger_student_id', 'wallet_ledger', 'student_id'],
      ['idx_scholarship_tests_student_id', 'scholarship_tests', 'student_id'],
      ['idx_offers_type', 'offers', 'type'],
    ] as const;
    for (const [name, table, column] of indexes) {
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "${name}" ON "${table}" ("${column}")`);
    }

    await queryRunner.query(`
      INSERT INTO "settings" ("key", "value")
      VALUES ('monthly_fee', '5000'::jsonb)
      ON CONFLICT ("key") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "offers" ("name", "slug", "description", "type", "discount_percentage", "discount_amount", "applies_to", "min_course_duration_months", "is_active")
      VALUES
        ('Quarterly Discount', 'quarterly-discount', 'Save 20% when paying quarterly.', 'quarterly_discount', 20, 0, 'quarterly', 6, true),
        ('Full Course Discount', 'full-course-discount', 'Save 35% on full course payment.', 'full_course_discount', 35, 0, 'full_course', NULL, true),
        ('Referral New Student Discount', 'referral-new-student-discount', 'New applicants get PKR 500 off first payment.', 'referral_new_student_discount', 0, 500, 'first_payment', NULL, true),
        ('Referral Reward', 'referral-reward', 'Referrer gets PKR 1,000 wallet credit after verified payment.', 'referral_reward', 0, 1000, 'wallet', NULL, true),
        ('Scholarship Discount', 'scholarship-discount', '80%+ quarterly test score unlocks 50% off next quarter.', 'scholarship_discount', 50, 0, 'next_quarter', NULL, true)
      ON CONFLICT ("slug") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "offers"');
    await queryRunner.query('DROP TABLE IF EXISTS "scholarship_tests"');
    await queryRunner.query('DROP TABLE IF EXISTS "wallet_ledger"');
    await queryRunner.query('DROP TABLE IF EXISTS "referral_redemptions"');
    await queryRunner.query('DROP TABLE IF EXISTS "referral_codes"');
    await queryRunner.query('DROP TABLE IF EXISTS "student_wallets"');
    await queryRunner.query('DROP TABLE IF EXISTS "payment_intents"');
    await queryRunner.query('DROP TABLE IF EXISTS "admission_applications"');
    await queryRunner.query('ALTER TABLE "payments" DROP COLUMN IF EXISTS "raw_gateway_response", DROP COLUMN IF EXISTS "gateway_reference", DROP COLUMN IF EXISTS "gateway", DROP COLUMN IF EXISTS "payment_intent_id", DROP COLUMN IF EXISTS "invoice_id"');
    await queryRunner.query('ALTER TABLE "invoices" DROP COLUMN IF EXISTS "paid_at", DROP COLUMN IF EXISTS "due_date", DROP COLUMN IF EXISTS "pending_amount", DROP COLUMN IF EXISTS "paid_amount", DROP COLUMN IF EXISTS "payable_amount", DROP COLUMN IF EXISTS "wallet_credit_used", DROP COLUMN IF EXISTS "scholarship_discount_amount", DROP COLUMN IF EXISTS "referral_coupon_discount_amount", DROP COLUMN IF EXISTS "plan_discount_amount", DROP COLUMN IF EXISTS "gross_amount", DROP COLUMN IF EXISTS "pricing_plan_type", DROP COLUMN IF EXISTS "fee_plan_id", DROP COLUMN IF EXISTS "enrollment_id", DROP COLUMN IF EXISTS "student_id", DROP COLUMN IF EXISTS "admission_application_id"');
    await queryRunner.query('ALTER TABLE "fee_plans" DROP COLUMN IF EXISTS "next_due_date", DROP COLUMN IF EXISTS "billing_cycle", DROP COLUMN IF EXISTS "wallet_credit_used", DROP COLUMN IF EXISTS "scholarship_discount_amount", DROP COLUMN IF EXISTS "referral_coupon_discount_amount", DROP COLUMN IF EXISTS "discount_percentage", DROP COLUMN IF EXISTS "base_monthly_fee", DROP COLUMN IF EXISTS "course_duration_months", DROP COLUMN IF EXISTS "pricing_type", DROP COLUMN IF EXISTS "course_id", DROP COLUMN IF EXISTS "student_id"');
    await queryRunner.query('ALTER TABLE "courses" DROP COLUMN IF EXISTS "monthly_fee"');
  }

  private async addForeignKeyIfMissing(
    queryRunner: QueryRunner,
    table: string,
    constraint: string,
    column: string,
    targetTable: string,
    targetColumn: string,
    onDelete: string,
  ) {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = '${constraint}'
        ) THEN
          ALTER TABLE "${table}"
          ADD CONSTRAINT "${constraint}"
          FOREIGN KEY ("${column}") REFERENCES "${targetTable}"("${targetColumn}") ON DELETE ${onDelete};
        END IF;
      END $$;
    `);
  }
}
