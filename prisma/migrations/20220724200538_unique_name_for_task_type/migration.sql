/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `task_type` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "task_type_name_key" ON "task_type"("name");
