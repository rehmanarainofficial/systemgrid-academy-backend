import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdmissionPaymentProofFields1783402000000
  implements MigrationInterface
{
  name = 'AddAdmissionPaymentProofFields1783402000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "admission_applications"
        ADD COLUMN IF NOT EXISTS "payment_reference" varchar,
        ADD COLUMN IF NOT EXISTS "payment_sender_number" varchar,
        ADD COLUMN IF NOT EXISTS "payment_proof_url" text,
        ADD COLUMN IF NOT EXISTS "payment_proof_submitted_at" timestamptz
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "admission_applications"
        DROP COLUMN IF EXISTS "payment_reference",
        DROP COLUMN IF EXISTS "payment_sender_number",
        DROP COLUMN IF EXISTS "payment_proof_url",
        DROP COLUMN IF EXISTS "payment_proof_submitted_at"
    `);
  }
}
