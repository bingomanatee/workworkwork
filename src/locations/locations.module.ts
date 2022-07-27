import { Module } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { PrismaService } from '../prisma.service';
import { BullModule } from '@nestjs/bull';

@Module({
  controllers: [LocationsController],
  providers: [LocationsService, PrismaService],
  imports: [
    BullModule.registerQueue({
      name: 'tasks',
    }),
  ],
})
export class LocationsModule {}
