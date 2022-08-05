-- CreateTable
CREATE TABLE "country_hex_share" (
    "id" SERIAL NOT NULL,
    "country_iso3" TEXT NOT NULL,
    "hex_id" TEXT NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "country_hex_share_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "country_hex_share" ADD CONSTRAINT "country_hex_share_country_iso3_fkey" FOREIGN KEY ("country_iso3") REFERENCES "countries"("iso3") ON DELETE RESTRICT ON UPDATE CASCADE;
