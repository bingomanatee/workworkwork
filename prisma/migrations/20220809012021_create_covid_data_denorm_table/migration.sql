-- CreateTable
CREATE TABLE "covid_data_denormalized" (
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
    "economic_support_index" DOUBLE PRECISION,
    "administrative_area_level" INTEGER,
    "administrative_area_level_1" TEXT,
    "administrative_area_level_2" TEXT,
    "administrative_area_level_3" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "population" INTEGER,
    "iso_alpha_3" VARCHAR(3) NOT NULL,
    "iso_alpha_2" VARCHAR(2),
    "iso_numeric" INTEGER,
    "iso_currency" VARCHAR(3),
    "key_local" TEXT,
    "key_google_mobility" TEXT,
    "key_apple_mobility" TEXT,
    "key_jhu_csse" VARCHAR(3),
    "key_nuts" VARCHAR(3),
    "key_gadm" VARCHAR(3)
);

-- CreateIndex
CREATE UNIQUE INDEX "covid_data_denormalized_date_iso_alpha_3_key" ON "covid_data_denormalized"("date", "iso_alpha_3");
