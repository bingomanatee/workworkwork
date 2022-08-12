/*
  Warnings:

  - The required column `id` was added to the `covid_data_pivot` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "covid_data_pivot" ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "covid_data_pivot_pkey" PRIMARY KEY ("id");
