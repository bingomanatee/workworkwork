/*
  Warnings:

  - The primary key for the `hexes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `hIndex` on the `hexes` table. All the data in the column will be lost.
  - Added the required column `hindex` to the `hexes` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "country_hex_share" DROP CONSTRAINT "country_hex_share_hindex_fkey";

-- AlterTable
ALTER TABLE "hexes" DROP CONSTRAINT "hexes_pkey",
DROP COLUMN "hIndex",
ADD COLUMN     "hindex" TEXT NOT NULL,
ADD CONSTRAINT "hexes_pkey" PRIMARY KEY ("hindex");

-- AddForeignKey
ALTER TABLE "country_hex_share" ADD CONSTRAINT "country_hex_share_hindex_fkey" FOREIGN KEY ("hindex") REFERENCES "hexes"("hindex") ON DELETE RESTRICT ON UPDATE CASCADE;
