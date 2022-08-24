-- CreateTable
CREATE TABLE "covid_hex_pivot" (
    "id" TEXT NOT NULL,
    "hindex" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "increment" INTEGER NOT NULL DEFAULT 1,
    "type" TEXT NOT NULL,
    "state_ids" TEXT[],
    "values_int" INTEGER[],
    "values_float" INTEGER[],

    CONSTRAINT "covid_hex_pivot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "covid_hex_pivot_hindex_field_key" ON "covid_hex_pivot"("hindex", "field");
