import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateComments1768000000000 implements MigrationInterface {
  name = 'CreateComments1768000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "work_item_comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workItemId" uuid NOT NULL, "authorId" uuid NOT NULL, "body" character varying(1000) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_work_item_comments_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_work_item_comments_workItemId" ON "work_item_comments" ("workItemId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_item_comments" ADD CONSTRAINT "FK_work_item_comments_workItemId" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_item_comments" ADD CONSTRAINT "FK_work_item_comments_authorId" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "work_item_comments" DROP CONSTRAINT "FK_work_item_comments_authorId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_item_comments" DROP CONSTRAINT "FK_work_item_comments_workItemId"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_work_item_comments_workItemId"`);
    await queryRunner.query(`DROP TABLE "work_item_comments"`);
  }
}
