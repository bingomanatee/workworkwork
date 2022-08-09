import { Module } from '@nestjs/common';
import { CovidCasesService } from './covid-cases.service';
import { CovidCasesController } from './covid-cases.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [CovidCasesController],
  providers: [CovidCasesService, PrismaService],
})
export class CovidCasesModule {}
