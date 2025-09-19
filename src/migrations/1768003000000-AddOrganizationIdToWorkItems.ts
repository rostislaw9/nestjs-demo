import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganizationIdToWorkItems1768003000000
  implements MigrationInterface
{
  name = 'AddOrganizationIdToWorkItems1768003000000';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "work_items"
      ADD COLUMN "organizationId" uuid NULL
        REFERENCES "organizations"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_work_items_organizationId"
      ON "work_items" ("organizationId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_work_items_organizationId"`);
    await queryRunner.query(
      `ALTER TABLE "work_items" DROP COLUMN "organizationId"`,
    );
  }
}
