import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { PrismaService } from '../prisma.service';
import { RepeatService } from './repeat/repeat.service';
import { BullModule } from '@nestjs/bull';
import { TaskProcessor } from './repeat/task-processor';
import { CsvService } from './csv/csv.service';
import { PivotFieldsService } from './pivot-fields/pivot-fields.service';
import { RecordBufferService } from '../record-buffer/record-buffer.service';
import { StatesService } from './states/states.service';
import { QueuesModule } from '../queues/queues.module';
import { QueueManagerService } from '../queues/queue-manager/queue-manager.service';
@Module({
  controllers: [TasksController],
  providers: [
    TasksService,
    PrismaService,
    RepeatService,
    TaskProcessor,
    CsvService,
    PivotFieldsService,
    QueueManagerService,
    RecordBufferService,
    StatesService,
  ],
  imports: [
    QueuesModule,
    BullModule.registerQueue({
      name: 'tasks',
    }),
  ],
})
export class TasksModule {}
