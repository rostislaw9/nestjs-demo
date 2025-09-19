import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkItems1767352000000 implements MigrationInterface {
  name = 'CreateWorkItems1767352000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "work_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ownerId" uuid NOT NULL, "title" character varying(120) NOT NULL, "description" character varying(500), "status" character varying(32) NOT NULL DEFAULT 'todo', "priority" character varying(16) NOT NULL DEFAULT 'medium', "dueDate" date, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_work_items_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_items" ADD CONSTRAINT "FK_work_items_owner" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_work_items_owner_status" ON "work_items" ("ownerId", "status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_work_items_owner_status"`);
    await queryRunner.query(
      `ALTER TABLE "work_items" DROP CONSTRAINT "FK_work_items_owner"`,
    );
    await queryRunner.query(`DROP TABLE "work_items"`);
  }
}
