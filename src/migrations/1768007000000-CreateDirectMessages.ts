import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDirectMessages1768007000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "direct_messages" (
        "id"          uuid              NOT NULL DEFAULT gen_random_uuid(),
        "senderId"    uuid              NOT NULL,
        "recipientId" uuid              NOT NULL,
        "body"        varchar(2000)     NOT NULL,
        "read"        boolean           NOT NULL DEFAULT false,
        "createdAt"   timestamptz       NOT NULL DEFAULT now(),
        CONSTRAINT "PK_direct_messages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_dm_sender"    FOREIGN KEY ("senderId")    REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_dm_recipient" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_dm_sender"    ON "direct_messages" ("senderId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dm_recipient" ON "direct_messages" ("recipientId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dm_created"   ON "direct_messages" ("createdAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "direct_messages"`);
  }
}
