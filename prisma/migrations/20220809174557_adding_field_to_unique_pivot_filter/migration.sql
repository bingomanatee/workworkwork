/*
  Warnings:

  - A unique constraint covering the columns `[date,iso_alpha_3,field]` on the table `covid_data_pivot` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "covid_data_pivot_date_iso_alpha_3_key";

-- CreateIndex
CREATE UNIQUE INDEX "covid_data_pivot_date_iso_alpha_3_field_key" ON "covid_data_pivot"("date", "iso_alpha_3", "field");
