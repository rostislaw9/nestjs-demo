import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssigneeIdToWorkItems1768004000000
  implements MigrationInterface
{
  name = 'AddAssigneeIdToWorkItems1768004000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "work_items"
      ADD COLUMN "assigneeId" uuid NULL
        REFERENCES "users"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_work_items_assigneeId"
      ON "work_items" ("assigneeId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_work_items_assigneeId"`);
    await queryRunner.query(
      `ALTER TABLE "work_items" DROP COLUMN "assigneeId"`,
    );
  }
}
