import { Test, TestingModule } from '@nestjs/testing';
import { StatCounterService } from './stat-counter.service';

describe('StatCounterService', () => {
  let service: StatCounterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StatCounterService],
    }).compile();

    service = module.get<StatCounterService>(StatCounterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
