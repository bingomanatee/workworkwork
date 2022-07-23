import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { PrismaService } from '../prisma.service';
import { RepeatService } from './repeat/repeat.service';

@Module({
  controllers: [TasksController],
  providers: [TasksService, PrismaService, RepeatService],
})
export class TasksModule {}
