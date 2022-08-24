/*
  Warnings:

  - A unique constraint covering the columns `[date,key_gadm]` on the table `covid_state_denormalized` will be added. If there are existing duplicate values, this will fail.
  - Made the column `key_gadm` on table `covid_state_denormalized` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "covid_state_denormalized_date_iso_alpha_3_administrative_ar_key";

-- AlterTable
ALTER TABLE "covid_state_denormalized" ALTER COLUMN "key_gadm" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "covid_state_denormalized_date_key_gadm_key" ON "covid_state_denormalized"("date", "key_gadm");
