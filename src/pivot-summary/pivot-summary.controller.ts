import { Controller, Get, Param } from "@nestjs/common";
import { PivotSummaryService } from './pivot-summary.service';

@Controller('api/pivot-summary')
export class PivotSummaryController {
  constructor(private readonly pivotSummaryService: PivotSummaryService) {
  }
  @Get('summary/:field')
  findAll(@Param('field') field: string) {
    return this.pivotSummaryService.getForField(field);
  }
}
