import { Test, TestingModule } from '@nestjs/testing';
import { PivotSummaryService } from './pivot-summary.service';

describe('PivotSummaryService', () => {
  let service: PivotSummaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PivotSummaryService],
    }).compile();

    service = module.get<PivotSummaryService>(PivotSummaryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
