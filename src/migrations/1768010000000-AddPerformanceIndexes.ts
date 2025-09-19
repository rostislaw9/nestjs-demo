import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1768010000000 implements MigrationInterface {
  name = 'AddPerformanceIndexes1768010000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_work_items_org_status_position"
      ON "work_items" ("organizationId", "status", "position", "createdAt" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_work_items_personal_status_position"
      ON "work_items" ("ownerId", "status", "position", "createdAt" DESC)
      WHERE "organizationId" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_activities_user_created"
      ON "activities" ("userId", "createdAt" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_activities_org_created"
      ON "activities" ("organizationId", "createdAt" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_comments_work_item_created"
      ON "work_item_comments" ("workItemId", "createdAt")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_dm_sender_recipient_created"
      ON "direct_messages" ("senderId", "recipientId", "createdAt" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_dm_recipient_sender_created"
      ON "direct_messages" ("recipientId", "senderId", "createdAt" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_dm_unread_recipient_sender"
      ON "direct_messages" ("recipientId", "senderId")
      WHERE "read" = false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_dm_unread_recipient_sender"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_dm_recipient_sender_created"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_dm_sender_recipient_created"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_comments_work_item_created"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_activities_org_created"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_activities_user_created"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_work_items_personal_status_position"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_work_items_org_status_position"`,
    );
  }
}
