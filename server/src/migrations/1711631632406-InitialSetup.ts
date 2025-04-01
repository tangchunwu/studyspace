import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSetup1711631632406 implements MigrationInterface {
    name = 'InitialSetup1711631632406'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 创建用户表
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying NOT NULL,
                "student_id" character varying NOT NULL,
                "name" character varying NOT NULL,
                "password" character varying NOT NULL,
                "avatar_url" character varying,
                "credit_score" integer NOT NULL DEFAULT 100,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "UQ_107b41e7d18e30b0dad08966697" UNIQUE ("student_id"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);

        // 创建自习室表
        await queryRunner.query(`
            CREATE TYPE "public"."study_rooms_status_enum" AS ENUM('available', 'maintenance', 'closed')
        `);
        await queryRunner.query(`
            CREATE TABLE "study_rooms" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "room_number" character varying NOT NULL,
                "capacity" integer NOT NULL,
                "status" "public"."study_rooms_status_enum" NOT NULL DEFAULT 'available',
                "location" character varying NOT NULL,
                "description" character varying,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_2117eb400ada7b20a8cf58a5477" UNIQUE ("room_number"),
                CONSTRAINT "PK_50c6ba110d888b0e0ef41b07cb8" PRIMARY KEY ("id")
            )
        `);

        // 创建座位表
        await queryRunner.query(`
            CREATE TABLE "seats" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "seat_number" character varying NOT NULL,
                "is_available" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "room_id" uuid,
                CONSTRAINT "UQ_7d648d6a9c484786e384d37e526" UNIQUE ("room_id", "seat_number"),
                CONSTRAINT "PK_cda20c200a7ea5a58742dee6d8a" PRIMARY KEY ("id")
            )
        `);

        // 创建预约表
        await queryRunner.query(`
            CREATE TYPE "public"."reservations_status_enum" AS ENUM('pending', 'confirmed', 'canceled', 'completed')
        `);
        await queryRunner.query(`
            CREATE TABLE "reservations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "start_time" TIMESTAMP NOT NULL,
                "end_time" TIMESTAMP NOT NULL,
                "status" "public"."reservations_status_enum" NOT NULL DEFAULT 'confirmed',
                "check_in_time" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "user_id" uuid,
                "room_id" uuid,
                "seat_id" uuid,
                CONSTRAINT "PK_da95cef71b617ac35dc5bcda243" PRIMARY KEY ("id")
            )
        `);

        // 创建签到表
        await queryRunner.query(`
            CREATE TYPE "public"."check_ins_status_enum" AS ENUM('on_time', 'late', 'missed')
        `);
        await queryRunner.query(`
            CREATE TABLE "check_ins" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "check_in_time" TIMESTAMP NOT NULL,
                "check_out_time" TIMESTAMP,
                "status" "public"."check_ins_status_enum" NOT NULL DEFAULT 'on_time',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "reservation_id" uuid,
                CONSTRAINT "REL_5141ad459a125143b5bf59c478" UNIQUE ("reservation_id"),
                CONSTRAINT "PK_7cecb5811d255974c578f11a98b" PRIMARY KEY ("id")
            )
        `);

        // 添加外键约束
        await queryRunner.query(`
            ALTER TABLE "seats" ADD CONSTRAINT "FK_2deea30ea08fe3012351838b440"
            FOREIGN KEY ("room_id") REFERENCES "study_rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "reservations" ADD CONSTRAINT "FK_aa0e1cc2c4f54da32bf8282154c"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "reservations" ADD CONSTRAINT "FK_9e842d1d76ab7dabefc1c428cc8"
            FOREIGN KEY ("room_id") REFERENCES "study_rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "reservations" ADD CONSTRAINT "FK_8af15cb2228d9aaaf1bdf73fe5c"
            FOREIGN KEY ("seat_id") REFERENCES "seats"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "check_ins" ADD CONSTRAINT "FK_5141ad459a125143b5bf59c4784"
            FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // 创建索引
        await queryRunner.query(`
            CREATE INDEX "IDX_aa0e1cc2c4f54da32bf8282154" ON "reservations" ("user_id", "status")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_8af15cb2228d9aaaf1bdf73fe5" ON "reservations" ("seat_id", "start_time", "end_time")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_27a9da91dd47b6a43b3c2b75ea" ON "reservations" ("status", "start_time")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 删除外键约束
        await queryRunner.query(`ALTER TABLE "check_ins" DROP CONSTRAINT "FK_5141ad459a125143b5bf59c4784"`);
        await queryRunner.query(`ALTER TABLE "reservations" DROP CONSTRAINT "FK_8af15cb2228d9aaaf1bdf73fe5c"`);
        await queryRunner.query(`ALTER TABLE "reservations" DROP CONSTRAINT "FK_9e842d1d76ab7dabefc1c428cc8"`);
        await queryRunner.query(`ALTER TABLE "reservations" DROP CONSTRAINT "FK_aa0e1cc2c4f54da32bf8282154c"`);
        await queryRunner.query(`ALTER TABLE "seats" DROP CONSTRAINT "FK_2deea30ea08fe3012351838b440"`);

        // 删除索引
        await queryRunner.query(`DROP INDEX "public"."IDX_27a9da91dd47b6a43b3c2b75ea"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8af15cb2228d9aaaf1bdf73fe5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_aa0e1cc2c4f54da32bf8282154"`);

        // 删除表
        await queryRunner.query(`DROP TABLE "check_ins"`);
        await queryRunner.query(`DROP TYPE "public"."check_ins_status_enum"`);
        await queryRunner.query(`DROP TABLE "reservations"`);
        await queryRunner.query(`DROP TYPE "public"."reservations_status_enum"`);
        await queryRunner.query(`DROP TABLE "seats"`);
        await queryRunner.query(`DROP TABLE "study_rooms"`);
        await queryRunner.query(`DROP TYPE "public"."study_rooms_status_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }
} 