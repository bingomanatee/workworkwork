-- CreateTable
CREATE TABLE "task_event" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "task_event_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "task_event" ADD CONSTRAINT "task_event_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
