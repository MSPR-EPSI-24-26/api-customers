import { MigrationInterface, QueryRunner } from "typeorm";

export class InitDatabase1758225435625 implements MigrationInterface {
    name = 'InitDatabase1758225435625'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."customers_role_enum" AS ENUM('customer', 'admin')`);
        await queryRunner.query(`CREATE TYPE "public"."customers_type_enum" AS ENUM('individual', 'professional')`);
        await queryRunner.query(`CREATE TABLE "customers" ("id" SERIAL NOT NULL, "firstName" character varying(100) NOT NULL, "lastName" character varying(100) NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "phone" character varying(20), "role" "public"."customers_role_enum" NOT NULL DEFAULT 'customer', "address" character varying(255) NOT NULL, "city" character varying(100) NOT NULL, "postalCode" character varying(10) NOT NULL, "country" character varying(100) NOT NULL, "type" "public"."customers_type_enum" NOT NULL DEFAULT 'individual', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8536b8b85c06969f84f0c098b03" UNIQUE ("email"), CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "customers"`);
        await queryRunner.query(`DROP TYPE "public"."customers_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."customers_role_enum"`);
    }

}
