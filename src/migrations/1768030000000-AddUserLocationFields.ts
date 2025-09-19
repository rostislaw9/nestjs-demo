import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserLocationFields1768030000000 implements MigrationInterface {
  name = 'AddUserLocationFields1768030000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove old location column
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "location"`,
    );

    // Add latitude and longitude columns
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "latitude" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "longitude" double precision`,
    );

    // Add location privacy column with default 'hidden'
    await queryRunner.query(
      `CREATE TYPE "location_privacy_enum" AS ENUM ('hidden', 'organizations', 'public')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "locationPrivacy" "location_privacy_enum" DEFAULT 'hidden'`,
    );

    // Create indexes for latitude and longitude
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_latitude" ON "users" ("latitude")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_longitude" ON "users" ("longitude")`,
    );

    // Create spatial index using GiST for efficient geo queries
    // Note: This requires the btree_gist extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "btree_gist"`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_location_coords" ON "users" USING gist ("latitude", "longitude")`,
    );

    // Create partial index for users with public or organizations location
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_location_privacy_visible" ON "users" ("locationPrivacy") WHERE "locationPrivacy" != 'hidden'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_users_location_privacy_visible"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_location_coords"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_longitude"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_latitude"`);

    // Drop columns
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "locationPrivacy"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "longitude"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "latitude"`,
    );

    // Drop enum type
    await queryRunner.query(`DROP TYPE IF EXISTS "location_privacy_enum"`);

    // Add back location column
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "location" character varying`,
    );
  }
}
