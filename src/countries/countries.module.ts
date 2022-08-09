import { Module } from '@nestjs/common';
import { CountriesService } from './countries.service';
import { CountriesController } from './countries.controller';
import { PrismaService } from '../prisma.service';
import { ScheduleModule } from '@nestjs/schedule';
import { StatCounterService } from './stat-counter/stat-counter.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [CountriesController],
  providers: [PrismaService, CountriesService, StatCounterService],
})
export class CountriesModule {}
