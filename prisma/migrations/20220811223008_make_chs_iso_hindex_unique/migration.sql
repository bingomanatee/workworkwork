/*
  Warnings:

  - A unique constraint covering the columns `[country_iso3,hindex]` on the table `country_hex_share` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "country_hex_share_country_iso3_hindex_key" ON "country_hex_share"("country_iso3", "hindex");
