import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserProfileFields1767350000000 implements MigrationInterface {
  name = 'AddUserProfileFields1767350000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "avatarUrl" text`);
    await queryRunner.query(`ALTER TABLE "users" ADD "bio" character varying`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "title" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "company" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "location" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "location"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "company"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "title"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "bio"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatarUrl"`);
  }
}
