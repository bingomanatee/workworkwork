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

import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { QueuesModule } from './queues/queues.module';

const REDIS = { host: 'localhost', port: 6379 };

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
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../../', 'client'),
    }),
    QueuesModule,
  ],
  controllers: [
   // AppController
  ],
  providers: [AppService, PrismaService],
})
export class AppModule {}
