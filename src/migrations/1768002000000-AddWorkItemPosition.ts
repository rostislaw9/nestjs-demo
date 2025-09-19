import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkItemPosition1768002000000 implements MigrationInterface {
  name = 'AddWorkItemPosition1768002000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "work_items" ADD "position" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(`
      UPDATE "work_items" wi
      SET "position" = sub.rn
      FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY "ownerId", "status" ORDER BY "createdAt" DESC) - 1 AS rn
        FROM "work_items"
      ) sub
      WHERE wi.id = sub.id
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "work_items" DROP COLUMN "position"`);
  }
}
