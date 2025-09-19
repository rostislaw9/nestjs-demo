import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBoards1768020000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "boards" (
        "id"             uuid              NOT NULL DEFAULT gen_random_uuid(),
        "title"          varchar(120)      NOT NULL,
        "ownerId"        uuid              NOT NULL,
        "organizationId" uuid,
        "createdAt"      timestamptz       NOT NULL DEFAULT now(),
        "updatedAt"      timestamptz       NOT NULL DEFAULT now(),
        CONSTRAINT "PK_boards" PRIMARY KEY ("id"),
        CONSTRAINT "FK_boards_owner"   FOREIGN KEY ("ownerId")        REFERENCES "users"("id")         ON DELETE CASCADE,
        CONSTRAINT "FK_boards_org"     FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "board_members" (
        "id"       uuid        NOT NULL DEFAULT gen_random_uuid(),
        "boardId"  uuid        NOT NULL,
        "userId"   uuid        NOT NULL,
        "joinedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_board_members"        PRIMARY KEY ("id"),
        CONSTRAINT "UQ_board_members"        UNIQUE ("boardId", "userId"),
        CONSTRAINT "FK_board_members_board"  FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_board_members_user"   FOREIGN KEY ("userId")  REFERENCES "users"("id")  ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "board_elements" (
        "id"          uuid        NOT NULL DEFAULT gen_random_uuid(),
        "boardId"     uuid        NOT NULL,
        "authorId"    uuid        NOT NULL,
        "type"        varchar(32) NOT NULL,
        "data"        jsonb       NOT NULL DEFAULT '{}',
        "color"       varchar(16) NOT NULL DEFAULT '#000000',
        "strokeWidth" float       NOT NULL DEFAULT 2,
        "zIndex"      int         NOT NULL DEFAULT 0,
        "createdAt"   timestamptz NOT NULL DEFAULT now(),
        "updatedAt"   timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_board_elements"       PRIMARY KEY ("id"),
        CONSTRAINT "FK_board_elements_board" FOREIGN KEY ("boardId")  REFERENCES "boards"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_board_elements_user"  FOREIGN KEY ("authorId") REFERENCES "users"("id")  ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_board_elements_boardId" ON "board_elements" ("boardId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_board_members_boardId" ON "board_members" ("boardId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_boards_ownerId" ON "boards" ("ownerId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_boards_organizationId" ON "boards" ("organizationId")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "board_elements"`);
    await queryRunner.query(`DROP TABLE "board_members"`);
    await queryRunner.query(`DROP TABLE "boards"`);
  }
}
