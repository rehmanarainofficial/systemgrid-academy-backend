import { MigrationInterface, QueryRunner } from 'typeorm';

export class NormalizeCourseDisplayOrder1784200000000 implements MigrationInterface {
  name = 'NormalizeCourseDisplayOrder1784200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      WITH ranked AS (
        SELECT
          id,
          ROW_NUMBER() OVER (ORDER BY display_order ASC, created_at ASC) AS new_order
        FROM courses
      )
      UPDATE courses
      SET display_order = ranked.new_order
      FROM ranked
      WHERE courses.id = ranked.id
    `);
  }

  public async down(): Promise<void> {
    // No-op: previous order values are not recoverable.
  }
}
