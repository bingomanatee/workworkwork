-- CreateTable
CREATE TABLE "hexes" (
    "hIndex" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "boundary" JSONB[],
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "shapes" JSONB[],

    CONSTRAINT "hexes_pkey" PRIMARY KEY ("hIndex")
);
