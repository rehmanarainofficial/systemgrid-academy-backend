import { MigrationInterface, QueryRunner } from 'typeorm';

export class AccessControlAndInstructorRole1783400000000
  implements MigrationInterface
{
  name = 'AccessControlAndInstructorRole1783400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add the new 'instructor' value to the existing users.role enum type.
    await queryRunner.query(`
      DO $$
      DECLARE role_type regtype;
      BEGIN
        SELECT atttypid::regtype INTO role_type
        FROM pg_attribute
        WHERE attrelid = 'users'::regclass AND attname = 'role';
        IF role_type IS NOT NULL THEN
          EXECUTE format('ALTER TYPE %s ADD VALUE IF NOT EXISTS %L', role_type, 'instructor');
        END IF;
      END$$;
    `);

    // 2. Enum types for the role_permissions table.
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_permissions_role_enum') THEN
          CREATE TYPE "role_permissions_role_enum" AS ENUM ('super_admin', 'admin', 'staff', 'instructor', 'student');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_permissions_access_level_enum') THEN
          CREATE TYPE "role_permissions_access_level_enum" AS ENUM ('none', 'read', 'full');
        END IF;
      END$$;
    `);

    // 3. The role_permissions matrix table (seeded at runtime by the service).
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "role_permissions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "role" "role_permissions_role_enum" NOT NULL,
        "resource" varchar(64) NOT NULL,
        "access_level" "role_permissions_access_level_enum" NOT NULL DEFAULT 'none',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_role_permissions" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "uq_role_permissions_role_resource" ON "role_permissions" ("role", "resource")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "role_permissions"');
    await queryRunner.query(
      'DROP TYPE IF EXISTS "role_permissions_access_level_enum"',
    );
    await queryRunner.query('DROP TYPE IF EXISTS "role_permissions_role_enum"');
    // Note: Postgres cannot easily remove an enum value, so 'instructor'
    // remains on the users.role enum after a revert (harmless).
  }
}
