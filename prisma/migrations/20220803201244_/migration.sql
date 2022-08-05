-- CreateTable
CREATE TABLE "countries" (
    "iso2" TEXT NOT NULL,
    "iso3" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "population" INTEGER,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "boundary" JSONB[],

    CONSTRAINT "countries_pkey" PRIMARY KEY ("iso3")
);

-- CreateTable
CREATE TABLE "country_shape" (
    "id" SERIAL NOT NULL,
    "index" INTEGER NOT NULL,
    "boundary" JSONB[],

    CONSTRAINT "country_shape_pkey" PRIMARY KEY ("id")
);
