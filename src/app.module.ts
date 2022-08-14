/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TaskTypesModule } from './task-types/task-types.module';
import { TasksModule } from './tasks/tasks.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { PrismaService } from './prisma.service';
import { CovidCasesModule } from './covid-cases/covid-cases.module';
import { LocationsModule } from './locations/locations.module';
import { HexesModule } from './hexes/hexes.module';
import { CountriesModule } from './countries/countries.module';
import { PivotSummaryModule } from './pivot-summary/pivot-summary.module';

/*
const REDIS = {
  host: process.env.REDIS_ENDPOINT,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
};
 */

const REDIS = { host: 'localhost', port: 6379 };
console.log('redis def:', REDIS);

@Module({
  imports: [
    TaskTypesModule,
    TasksModule,
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      // @ts-ignore
      redis: REDIS,
    }),
    CovidCasesModule,
    LocationsModule,
    HexesModule,
    CountriesModule,
    PivotSummaryModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
