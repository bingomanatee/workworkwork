/*
  Warnings:

  - A unique constraint covering the columns `[date,id]` on the table `covid_state_denormalized` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `key_gadm` to the `states` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "covid_state_denormalized_date_key_gadm_key";

-- DropIndex
DROP INDEX "states_iso_alpha_3_administrative_area_level_1_administrati_key";

-- AlterTable
ALTER TABLE "states" ADD COLUMN     "key_gadm" TEXT NOT NULL,
ADD CONSTRAINT "states_pkey" PRIMARY KEY ("key_gadm");

-- CreateIndex
CREATE UNIQUE INDEX "covid_state_denormalized_date_id_key" ON "covid_state_denormalized"("date", "id");
