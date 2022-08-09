-- AlterTable
ALTER TABLE "covid_location" ALTER COLUMN "iso3" SET DEFAULT '';

-- AlterTable
ALTER TABLE "covid_stats" ADD COLUMN     "iso3" TEXT NOT NULL DEFAULT '';
