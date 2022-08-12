import { Test, TestingModule } from '@nestjs/testing';
import { PivotFieldsService } from './pivot-fields.service';

describe('PivotFieldsService', () => {
  let service: PivotFieldsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PivotFieldsService],
    }).compile();

    service = module.get<PivotFieldsService>(PivotFieldsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
