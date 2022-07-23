import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { PrismaService } from '../prisma.service';
import { RepeatService } from './repeat/repeat.service';
import { BullModule } from '@nestjs/bull';
import { TaskProcessor } from './repeat/task-processor';
import { GithubService } from './github/github.service';
import { CsvService } from './csv/csv.service';
@Module({
  controllers: [TasksController],
  providers: [TasksService, PrismaService, RepeatService, TaskProcessor, GithubService, CsvService],
  imports: [
    BullModule.registerQueue({
      name: 'tasks',
    }),
  ],
})
export class TasksModule {}
