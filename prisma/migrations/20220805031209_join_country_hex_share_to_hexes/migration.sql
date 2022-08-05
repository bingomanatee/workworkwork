/*
  Warnings:

  - You are about to drop the column `hex_id` on the `country_hex_share` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "country_hex_share" DROP COLUMN "hex_id";

-- CreateTable
CREATE TABLE "_country_hex_shareTohexes" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_country_hex_shareTohexes_AB_unique" ON "_country_hex_shareTohexes"("A", "B");

-- CreateIndex
CREATE INDEX "_country_hex_shareTohexes_B_index" ON "_country_hex_shareTohexes"("B");

-- AddForeignKey
ALTER TABLE "_country_hex_shareTohexes" ADD CONSTRAINT "_country_hex_shareTohexes_A_fkey" FOREIGN KEY ("A") REFERENCES "country_hex_share"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_country_hex_shareTohexes" ADD CONSTRAINT "_country_hex_shareTohexes_B_fkey" FOREIGN KEY ("B") REFERENCES "hexes"("hIndex") ON DELETE CASCADE ON UPDATE CASCADE;
