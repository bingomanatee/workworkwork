/*
  Warnings:

  - You are about to drop the `_country_hex_shareTohexes` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `hindex` to the `country_hex_share` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_country_hex_shareTohexes" DROP CONSTRAINT "_country_hex_shareTohexes_A_fkey";

-- DropForeignKey
ALTER TABLE "_country_hex_shareTohexes" DROP CONSTRAINT "_country_hex_shareTohexes_B_fkey";

-- AlterTable
ALTER TABLE "country_hex_share" ADD COLUMN     "hindex" TEXT NOT NULL;

-- DropTable
DROP TABLE "_country_hex_shareTohexes";

-- AddForeignKey
ALTER TABLE "country_hex_share" ADD CONSTRAINT "country_hex_share_hindex_fkey" FOREIGN KEY ("hindex") REFERENCES "hexes"("hIndex") ON DELETE RESTRICT ON UPDATE CASCADE;
