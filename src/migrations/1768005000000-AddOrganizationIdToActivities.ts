import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganizationIdToActivities1768005000000
  implements MigrationInterface
{
  name = 'AddOrganizationIdToActivities1768005000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "activities"
      ADD COLUMN "organizationId" uuid NULL
        REFERENCES "organizations"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_activities_organizationId"
      ON "activities" ("organizationId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_activities_organizationId"`);
    await queryRunner.query(
      `ALTER TABLE "activities" DROP COLUMN "organizationId"`,
    );
  }
}
