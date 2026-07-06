import { MigrationInterface, QueryRunner } from 'typeorm';

export class InstructorUserLink1783401000000 implements MigrationInterface {
  name = 'InstructorUserLink1783401000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "instructors"
        ADD COLUMN IF NOT EXISTS "user_id" uuid
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_instructors_user'
        ) THEN
          ALTER TABLE "instructors"
            ADD CONSTRAINT "FK_instructors_user"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;
        END IF;
      END$$;
    `);
    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "uq_instructors_user_id" ON "instructors" ("user_id") WHERE "user_id" IS NOT NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "uq_instructors_user_id"');
    await queryRunner.query(
      'ALTER TABLE "instructors" DROP CONSTRAINT IF EXISTS "FK_instructors_user"',
    );
    await queryRunner.query(
      'ALTER TABLE "instructors" DROP COLUMN IF EXISTS "user_id"',
    );
  }
}
