import { Test, TestingModule } from '@nestjs/testing';
import { RepeatService } from './repeat.service';

describe('RepeatService', () => {
  let service: RepeatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RepeatService],
    }).compile();

    service = module.get<RepeatService>(RepeatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
