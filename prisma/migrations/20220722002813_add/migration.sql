-- AlterTable
ALTER TABLE "task" ADD COLUMN     "parent_task_id" TEXT;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_parent_task_id_fkey" FOREIGN KEY ("parent_task_id") REFERENCES "task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
