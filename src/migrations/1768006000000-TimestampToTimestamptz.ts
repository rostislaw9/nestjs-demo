import { MigrationInterface, QueryRunner } from 'typeorm';

export class TimestampToTimestamptz1768006000000 implements MigrationInterface {
  name = 'TimestampToTimestamptz1768006000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tables: Record<string, string[]> = {
      users: ['createdAt', 'updatedAt'],
      work_items: ['createdAt', 'updatedAt'],
      work_item_comments: ['createdAt', 'updatedAt'],
      activities: ['createdAt'],
      organizations: ['createdAt', 'updatedAt'],
      organization_members: ['createdAt'],
    };

    for (const [table, cols] of Object.entries(tables)) {
      for (const col of cols) {
        await queryRunner.query(
          `ALTER TABLE "${table}" ALTER COLUMN "${col}" TYPE timestamptz USING "${col}" AT TIME ZONE 'UTC'`,
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables: Record<string, string[]> = {
      users: ['createdAt', 'updatedAt'],
      work_items: ['createdAt', 'updatedAt'],
      work_item_comments: ['createdAt', 'updatedAt'],
      activities: ['createdAt'],
      organizations: ['createdAt', 'updatedAt'],
      organization_members: ['createdAt'],
    };

    for (const [table, cols] of Object.entries(tables)) {
      for (const col of cols) {
        await queryRunner.query(
          `ALTER TABLE "${table}" ALTER COLUMN "${col}" TYPE timestamp USING "${col}" AT TIME ZONE 'UTC'`,
        );
      }
    }
  }
}
