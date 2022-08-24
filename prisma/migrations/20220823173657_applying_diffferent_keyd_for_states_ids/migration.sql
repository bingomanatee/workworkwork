/*
  Warnings:

  - The primary key for the `states` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `key_gadm` on the `states` table. All the data in the column will be lost.
  - Added the required column `id` to the `states` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "states" DROP CONSTRAINT "states_pkey",
DROP COLUMN "key_gadm",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "states_pkey" PRIMARY KEY ("id");
