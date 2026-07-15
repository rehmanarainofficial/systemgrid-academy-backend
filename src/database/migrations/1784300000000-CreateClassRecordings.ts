import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClassRecordings1784300000000 implements MigrationInterface {
  name = 'CreateClassRecordings1784300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "class_recordings" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "course_id" uuid NOT NULL,
        "batch_id" uuid,
        "title" varchar(200) NOT NULL,
        "description" text,
        "video_url" varchar(1000) NOT NULL,
        "resource_url" varchar(1000),
        "recorded_date" date NOT NULL,
        "is_published" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_class_recordings" PRIMARY KEY ("id"),
        CONSTRAINT "FK_class_recordings_course" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_class_recordings_batch" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_class_recordings_course_id" ON "class_recordings" ("course_id")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_class_recordings_batch_id" ON "class_recordings" ("batch_id")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_class_recordings_recorded_date" ON "class_recordings" ("recorded_date")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "class_recordings"');
  }
}
