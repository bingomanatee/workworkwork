-- CreateTable
CREATE TABLE "covid_stats_weekly" (
    "id" TEXT NOT NULL,
    "uid" INTEGER NOT NULL,
    "iso3" TEXT NOT NULL,
    "week" DATE NOT NULL,
    "confirmed" INTEGER,
    "people_tested" INTEGER,
    "incident_rate" DOUBLE PRECISION,
    "testing_rate" DOUBLE PRECISION,
    "hospitalization_rate" DOUBLE PRECISION,
    "deaths" INTEGER,
    "recovered" INTEGER,
    "active" INTEGER,

    CONSTRAINT "covid_stats_weekly_pkey" PRIMARY KEY ("id")
);
