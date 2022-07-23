import { Module } from '@nestjs/common';
import { CovidCasesService } from './covid-cases.service';
import { CovidCasesController } from './covid-cases.controller';

@Module({
  controllers: [CovidCasesController],
  providers: [CovidCasesService]
})
export class CovidCasesModule {}
