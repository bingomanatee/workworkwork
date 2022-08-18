import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { PrismaService } from '../prisma.service';
import { RepeatService } from './repeat/repeat.service';
import { BullModule } from '@nestjs/bull';
import { TaskProcessor } from './repeat/task-processor';
import { CsvService } from './csv/csv.service';
import { PivotFieldsService } from './pivot-fields/pivot-fields.service';
@Module({
  controllers: [TasksController],
  providers: [
    TasksService,
    PrismaService,
    RepeatService,
    TaskProcessor,
    CsvService,
    PivotFieldsService,
  ],
  imports: [
    BullModule.registerQueue({
      name: 'tasks',
    }),
  ],
})
export class TasksModule {

}
