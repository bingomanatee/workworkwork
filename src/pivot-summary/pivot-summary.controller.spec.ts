import { Test, TestingModule } from '@nestjs/testing';
import { PivotSummaryController } from './pivot-summary.controller';
import { PivotSummaryService } from './pivot-summary.service';

describe('PivotSummaryController', () => {
  let controller: PivotSummaryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PivotSummaryController],
      providers: [PivotSummaryService],
    }).compile();

    controller = module.get<PivotSummaryController>(PivotSummaryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
