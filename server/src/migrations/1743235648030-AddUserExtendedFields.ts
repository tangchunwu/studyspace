import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserExtendedFields1743235648030 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 添加手机号字段
        await queryRunner.query(`ALTER TABLE "users" ADD "phone_number" character varying`);
        
        // 添加专业字段
        await queryRunner.query(`ALTER TABLE "users" ADD "major" character varying`);
        
        // 添加年级字段
        await queryRunner.query(`ALTER TABLE "users" ADD "grade" character varying`);
        
        // 添加角色字段
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "role" "public"."users_role_enum" NOT NULL DEFAULT 'user'`);
        
        // 添加用户简介字段
        await queryRunner.query(`ALTER TABLE "users" ADD "bio" text`);
        
        // 添加最后登录时间字段
        await queryRunner.query(`ALTER TABLE "users" ADD "last_login" TIMESTAMP`);
        
        // 添加账号是否被禁用字段
        await queryRunner.query(`ALTER TABLE "users" ADD "is_disabled" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 删除账号是否被禁用字段
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_disabled"`);
        
        // 删除最后登录时间字段
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_login"`);
        
        // 删除用户简介字段
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "bio"`);
        
        // 删除角色字段
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        
        // 删除年级字段
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "grade"`);
        
        // 删除专业字段
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "major"`);
        
        // 删除手机号字段
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone_number"`);
    }

}
