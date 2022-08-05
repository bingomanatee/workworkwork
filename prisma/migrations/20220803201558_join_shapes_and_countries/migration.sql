/*
  Warnings:

  - Added the required column `country_iso3` to the `country_shape` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "country_shape" ADD COLUMN     "country_iso3" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "country_shape" ADD CONSTRAINT "country_shape_country_iso3_fkey" FOREIGN KEY ("country_iso3") REFERENCES "countries"("iso3") ON DELETE RESTRICT ON UPDATE CASCADE;
