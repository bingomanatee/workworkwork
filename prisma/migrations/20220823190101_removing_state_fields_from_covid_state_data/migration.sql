/*
  Warnings:

  - You are about to drop the `covid_state_denormalized` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "covid_state_denormalized";

-- CreateTable
CREATE TABLE "covid_state" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "confirmed" INTEGER,
    "deaths" INTEGER,
    "recovered" INTEGER,
    "tests" INTEGER,
    "vaccines" INTEGER,
    "people_vaccinated" INTEGER,
    "people_fully_vaccinated" INTEGER,
    "hosp" INTEGER,
    "icu" INTEGER,
    "vent" INTEGER,
    "school_closing" INTEGER,
    "workplace_closing" INTEGER,
    "cancel_events" INTEGER,
    "gatherings_restrictions" INTEGER,
    "transport_closing" INTEGER,
    "stay_home_restrictions" INTEGER,
    "internal_movement_restrictions" INTEGER,
    "international_movement_restrictions" INTEGER,
    "information_campaigns" INTEGER,
    "testing_policy" INTEGER,
    "contact_tracing" INTEGER,
    "facial_coverings" INTEGER,
    "vaccination_policy" INTEGER,
    "elderly_people_protection" INTEGER,
    "government_response_index" DOUBLE PRECISION,
    "stringency_index" DOUBLE PRECISION,
    "containment_health_index" DOUBLE PRECISION,
    "economic_support_index" DOUBLE PRECISION
);

-- CreateIndex
CREATE UNIQUE INDEX "covid_state_date_id_key" ON "covid_state"("date", "id");
