-- CreateTable
CREATE TABLE "task" (
    "id" TEXT NOT NULL,
    "task_type_id" TEXT NOT NULL,

    CONSTRAINT "task_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_task_type_id_fkey" FOREIGN KEY ("task_type_id") REFERENCES "task_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
