import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterAvatarUrlToText1767351000000 implements MigrationInterface {
  name = 'AlterAvatarUrlToText1767351000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "avatarUrl" TYPE text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "avatarUrl" TYPE character varying`,
    );
  }
}
