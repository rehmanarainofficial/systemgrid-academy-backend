import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBlogPosts1783081000000 implements MigrationInterface {
  name = 'CreateBlogPosts1783081000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "blog_posts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "author_id" uuid,
        "title" varchar(160) NOT NULL,
        "slug" varchar(180) NOT NULL,
        "excerpt" text NOT NULL,
        "content" text NOT NULL,
        "cover_image_url" varchar(1000),
        "category" varchar(80) NOT NULL DEFAULT 'Learning',
        "tags" text[] NOT NULL DEFAULT '{}',
        "seo_title" varchar(70),
        "seo_description" varchar(170),
        "is_published" boolean NOT NULL DEFAULT false,
        "published_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_blog_posts" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_blog_posts_slug" UNIQUE ("slug"),
        CONSTRAINT "FK_blog_posts_author" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_blog_posts_is_published" ON "blog_posts" ("is_published")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_blog_posts_published_at" ON "blog_posts" ("published_at")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_blog_posts_category" ON "blog_posts" ("category")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "blog_posts"');
  }
}
