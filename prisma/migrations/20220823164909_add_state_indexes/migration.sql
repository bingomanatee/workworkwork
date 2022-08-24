-- CreateTable
CREATE TABLE "states" (
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "iso_alpha_3" TEXT NOT NULL,
    "administrative_area_level_1" TEXT NOT NULL,
    "administrative_area_level_2" TEXT NOT NULL,
    "hindexes" TEXT[]
);

-- CreateIndex
CREATE UNIQUE INDEX "states_iso_alpha_3_administrative_area_level_1_administrati_key" ON "states"("iso_alpha_3", "administrative_area_level_1", "administrative_area_level_2");
