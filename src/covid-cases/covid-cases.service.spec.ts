import { Test, TestingModule } from '@nestjs/testing';
import { CovidCasesService } from './covid-cases.service';

describe('CovidCasesService', () => {
  let service: CovidCasesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CovidCasesService],
    }).compile();

    service = module.get<CovidCasesService>(CovidCasesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
