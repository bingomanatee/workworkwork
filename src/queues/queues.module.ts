import { Module } from '@nestjs/common';
import { QueueManagerService } from './queue-manager/queue-manager.service';
import { PrismaService } from '../prisma.service';

@Module({})
export class QueuesModule {
  imports: [PrismaService];
  providers: [QueueManagerService];
  exports: [QueueManagerService];
}
