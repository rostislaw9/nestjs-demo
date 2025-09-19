import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEditedToDirectMessages1768008000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "direct_messages" ADD COLUMN IF NOT EXISTS "edited" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "direct_messages" ADD COLUMN IF NOT EXISTS "updatedAt" timestamptz NOT NULL DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "direct_messages" DROP COLUMN IF EXISTS "edited"`,
    );
    await queryRunner.query(
      `ALTER TABLE "direct_messages" DROP COLUMN IF EXISTS "updatedAt"`,
    );
  }
}
