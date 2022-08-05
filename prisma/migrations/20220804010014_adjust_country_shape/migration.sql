/*
  Warnings:

  - Added the required column `points` to the `country_shape` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `boundary` on the `country_shape` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "country_shape" ADD COLUMN     "points" JSONB NOT NULL,
DROP COLUMN "boundary",
ADD COLUMN     "boundary" JSONB NOT NULL;
