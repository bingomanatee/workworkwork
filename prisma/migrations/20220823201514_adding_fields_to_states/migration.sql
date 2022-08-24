/*
  Warnings:

  - Added the required column `administrative_area_level` to the `states` table without a default value. This is not possible if the table is not empty.
  - Added the required column `key_gadm` to the `states` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "states" ADD COLUMN     "administrative_area_level" INTEGER NOT NULL,
ADD COLUMN     "administrative_area_level_3" TEXT,
ADD COLUMN     "iso_alpha_2" TEXT,
ADD COLUMN     "iso_currency" TEXT,
ADD COLUMN     "iso_numeric" INTEGER,
ADD COLUMN     "key_apple_mobility" TEXT,
ADD COLUMN     "key_gadm" TEXT NOT NULL,
ADD COLUMN     "key_google_mobility" TEXT,
ADD COLUMN     "key_jhu_csse" TEXT,
ADD COLUMN     "key_local" TEXT,
ADD COLUMN     "key_nuts" TEXT;
