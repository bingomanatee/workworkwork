import { Module } from '@nestjs/common';
import { PivotSummaryService } from './pivot-summary.service';
import { PivotSummaryController } from './pivot-summary.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [PivotSummaryController],
  providers: [PivotSummaryService, PrismaService],
})
export class PivotSummaryModule {}
