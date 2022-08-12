-- CreateTable
CREATE TABLE "covid_data_pivot" (
    "iso_alpha_3" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "increment" INTEGER NOT NULL DEFAULT 1,
    "type" TEXT NOT NULL,
    "values_int" INTEGER[],
    "values_float" INTEGER[]
);

-- CreateIndex
CREATE UNIQUE INDEX "covid_data_pivot_date_iso_alpha_3_key" ON "covid_data_pivot"("date", "iso_alpha_3");
