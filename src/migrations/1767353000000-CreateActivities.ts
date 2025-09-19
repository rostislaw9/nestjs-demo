import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateActivities1767353000000 implements MigrationInterface {
  name = 'CreateActivities1767353000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "activities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "type" character varying(32) NOT NULL, "workItemId" uuid, "description" character varying(255) NOT NULL, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_activities_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "activities" ADD CONSTRAINT "FK_activities_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_activities_user_created_at" ON "activities" ("userId", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_activities_type" ON "activities" ("type")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_activities_type"`);
    await queryRunner.query(`DROP INDEX "IDX_activities_user_created_at"`);
    await queryRunner.query(
      `ALTER TABLE "activities" DROP CONSTRAINT "FK_activities_user"`,
    );
    await queryRunner.query(`DROP TABLE "activities"`);
  }
}
