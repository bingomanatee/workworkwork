import { Test, TestingModule } from '@nestjs/testing';
import { CovidCasesController } from './covid-cases.controller';
import { CovidCasesService } from './covid-cases.service';

describe('CovidCasesController', () => {
  let controller: CovidCasesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CovidCasesController],
      providers: [CovidCasesService],
    }).compile();

    controller = module.get<CovidCasesController>(CovidCasesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
