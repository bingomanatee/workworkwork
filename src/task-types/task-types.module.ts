import { Module } from '@nestjs/common';
import { TaskTypesService } from './task-types.service';
import { TaskTypesController } from './task-types.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [TaskTypesController],
  providers: [TaskTypesService, PrismaService],
})
export class TaskTypesModule {}
