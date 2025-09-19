import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLocationTextField1768030000001 implements MigrationInterface {
  name = 'AddLocationTextField1768030000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "locationText" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "locationText"`);
  }
}
