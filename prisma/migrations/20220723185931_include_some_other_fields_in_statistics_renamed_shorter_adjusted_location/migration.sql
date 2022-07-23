-- CreateTable
CREATE TABLE "covid_stats" (
    "id" INTEGER NOT NULL,
    "uid" INTEGER NOT NULL,
    "date_published" DATE NOT NULL,
    "last_update" TIMESTAMP(3) NOT NULL,
    "confirmed" INTEGER,
    "people_tested" INTEGER,
    "incident_rate" DOUBLE PRECISION,
    "testing_rate" DOUBLE PRECISION,
    "hospitalization_rate" DOUBLE PRECISION,
    "deaths" INTEGER,
    "recovered" INTEGER,
    "active" INTEGER,

    CONSTRAINT "covid_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "covid_location" (
    "uid" INTEGER NOT NULL,
    "iso2" TEXT NOT NULL,
    "iso3" TEXT NOT NULL,
    "code3" TEXT,
    "fips" TEXT,
    "admin2" TEXT,
    "province_state" TEXT,
    "country_region" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "population" INTEGER,

    CONSTRAINT "covid_location_pkey" PRIMARY KEY ("uid")
);
