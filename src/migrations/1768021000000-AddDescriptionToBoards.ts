import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDescriptionToBoards1768021000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "boards" ADD COLUMN IF NOT EXISTS "description" varchar(500)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "boards" DROP COLUMN IF EXISTS "description"`,
    );
  }
}
