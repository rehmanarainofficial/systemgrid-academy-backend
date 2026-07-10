import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLearningPaths1783700000000 implements MigrationInterface {
  name = 'CreateLearningPaths1783700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "learning_paths" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "slug" varchar(180) NOT NULL,
        "title" varchar(200) NOT NULL,
        "badge" varchar(80),
        "level" varchar(80) NOT NULL,
        "duration" varchar(80) NOT NULL,
        "best_for" varchar(200) NOT NULL,
        "summary" text NOT NULL,
        "description" text NOT NULL,
        "guidance" text NOT NULL,
        "icon_key" varchar(60) NOT NULL DEFAULT 'route',
        "tools" text[] NOT NULL DEFAULT '{}',
        "related_slugs" text[] NOT NULL DEFAULT '{}',
        "primary_course_id" uuid,
        "is_published" boolean NOT NULL DEFAULT true,
        "is_featured" boolean NOT NULL DEFAULT false,
        "sort_order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_learning_paths" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_learning_paths_slug" UNIQUE ("slug"),
        CONSTRAINT "FK_learning_paths_primary_course" FOREIGN KEY ("primary_course_id") REFERENCES "courses"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_learning_paths_is_published" ON "learning_paths" ("is_published")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_learning_paths_sort_order" ON "learning_paths" ("sort_order")',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "learning_path_phases" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "learning_path_id" uuid NOT NULL,
        "title" varchar(160) NOT NULL,
        "description" text NOT NULL,
        "topics" text[] NOT NULL DEFAULT '{}',
        "sort_order" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_learning_path_phases" PRIMARY KEY ("id"),
        CONSTRAINT "FK_learning_path_phases_path" FOREIGN KEY ("learning_path_id") REFERENCES "learning_paths"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_learning_path_phases_learning_path_id" ON "learning_path_phases" ("learning_path_id")',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "learning_path_outcomes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "learning_path_id" uuid NOT NULL,
        "title" varchar(220) NOT NULL,
        "sort_order" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_learning_path_outcomes" PRIMARY KEY ("id"),
        CONSTRAINT "FK_learning_path_outcomes_path" FOREIGN KEY ("learning_path_id") REFERENCES "learning_paths"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_learning_path_outcomes_learning_path_id" ON "learning_path_outcomes" ("learning_path_id")',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "learning_path_courses" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "learning_path_id" uuid NOT NULL,
        "course_id" uuid NOT NULL,
        "sort_order" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_learning_path_courses" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_learning_path_courses_path_course" UNIQUE ("learning_path_id", "course_id"),
        CONSTRAINT "FK_learning_path_courses_path" FOREIGN KEY ("learning_path_id") REFERENCES "learning_paths"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_learning_path_courses_course" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_learning_path_courses_learning_path_id" ON "learning_path_courses" ("learning_path_id")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_learning_path_courses_course_id" ON "learning_path_courses" ("course_id")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "learning_path_courses"');
    await queryRunner.query('DROP TABLE IF EXISTS "learning_path_outcomes"');
    await queryRunner.query('DROP TABLE IF EXISTS "learning_path_phases"');
    await queryRunner.query('DROP TABLE IF EXISTS "learning_paths"');
  }
}
