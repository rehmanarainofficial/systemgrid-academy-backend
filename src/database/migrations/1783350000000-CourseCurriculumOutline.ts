import { MigrationInterface, QueryRunner } from 'typeorm';

export class CourseCurriculumOutline1783350000000 implements MigrationInterface {
  name = 'CourseCurriculumOutline1783350000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "courses"
        ADD COLUMN IF NOT EXISTS "duration_months" integer NOT NULL DEFAULT 3,
        ADD COLUMN IF NOT EXISTS "duration_label" character varying
    `);

    await queryRunner.query(`
      UPDATE "courses"
      SET "duration_months" = CASE
          WHEN "duration_unit" = 'months' THEN GREATEST(1, "duration")
          ELSE GREATEST(1, CEIL("duration"::numeric / 4)::integer)
        END,
        "duration_label" = CASE
          WHEN "duration_label" IS NOT NULL THEN "duration_label"
          WHEN "duration_unit" = 'months' THEN "duration" || ' Months'
          ELSE GREATEST(1, CEIL("duration"::numeric / 4)::integer) || ' Months'
        END,
        "monthly_fee" = 5000,
        "fee" = CASE
          WHEN "duration_unit" = 'months' THEN GREATEST(1, "duration") * 5000
          ELSE GREATEST(1, CEIL("duration"::numeric / 4)::integer) * 5000
        END
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "course_quarters" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "course_id" uuid NOT NULL,
        "quarter_number" integer NOT NULL,
        "title" character varying NOT NULL,
        "subtitle" character varying,
        "description" text,
        "duration_months" integer NOT NULL DEFAULT 3,
        "sort_order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_course_quarters_course" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE,
        CONSTRAINT "uq_course_quarters_course_number" UNIQUE ("course_id", "quarter_number")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_course_quarters_course_id" ON "course_quarters" ("course_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_course_quarters_sort_order" ON "course_quarters" ("sort_order")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "course_outline_modules" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "course_id" uuid NOT NULL,
        "quarter_id" uuid NOT NULL,
        "title" character varying NOT NULL,
        "description" text,
        "sort_order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_course_outline_modules_course" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_course_outline_modules_quarter" FOREIGN KEY ("quarter_id") REFERENCES "course_quarters"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_course_outline_modules_course_id" ON "course_outline_modules" ("course_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_course_outline_modules_quarter_id" ON "course_outline_modules" ("quarter_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_course_outline_modules_sort_order" ON "course_outline_modules" ("sort_order")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "course_topics" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "course_id" uuid NOT NULL,
        "quarter_id" uuid NOT NULL,
        "module_id" uuid NOT NULL,
        "title" character varying NOT NULL,
        "description" text,
        "level" character varying NOT NULL DEFAULT 'foundation',
        "sort_order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_course_topics_course" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_course_topics_quarter" FOREIGN KEY ("quarter_id") REFERENCES "course_quarters"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_course_topics_module" FOREIGN KEY ("module_id") REFERENCES "course_outline_modules"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_course_topics_course_id" ON "course_topics" ("course_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_course_topics_quarter_id" ON "course_topics" ("quarter_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_course_topics_module_id" ON "course_topics" ("module_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_course_topics_sort_order" ON "course_topics" ("sort_order")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "course_tools" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "course_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "type" character varying,
        "icon" character varying,
        "sort_order" integer NOT NULL DEFAULT 0,
        CONSTRAINT "fk_course_tools_course" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_course_tools_course_id" ON "course_tools" ("course_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_course_tools_sort_order" ON "course_tools" ("sort_order")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "course_projects" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "course_id" uuid NOT NULL,
        "title" character varying NOT NULL,
        "description" text,
        "quarter_number" integer,
        "skills" text,
        "sort_order" integer NOT NULL DEFAULT 0,
        CONSTRAINT "fk_course_projects_course" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_course_projects_course_id" ON "course_projects" ("course_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_course_projects_sort_order" ON "course_projects" ("sort_order")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "course_outcomes" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "course_id" uuid NOT NULL,
        "title" character varying NOT NULL,
        "description" text,
        "sort_order" integer NOT NULL DEFAULT 0,
        CONSTRAINT "fk_course_outcomes_course" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_course_outcomes_course_id" ON "course_outcomes" ("course_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_course_outcomes_sort_order" ON "course_outcomes" ("sort_order")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "course_faqs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "course_id" uuid NOT NULL,
        "question" character varying NOT NULL,
        "answer" text NOT NULL,
        "sort_order" integer NOT NULL DEFAULT 0,
        CONSTRAINT "fk_course_faqs_course" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_course_faqs_course_id" ON "course_faqs" ("course_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_course_faqs_sort_order" ON "course_faqs" ("sort_order")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "course_faqs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "course_outcomes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "course_projects"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "course_tools"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "course_topics"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "course_outline_modules"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "course_quarters"`);
    await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN IF EXISTS "duration_label"`);
    await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN IF EXISTS "duration_months"`);
  }
}
