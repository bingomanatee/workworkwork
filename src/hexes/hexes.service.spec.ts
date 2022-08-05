import { Test, TestingModule } from '@nestjs/testing';
import { HexesService } from './hexes.service';

describe('HexesService', () => {
  let service: HexesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HexesService],
    }).compile();

    service = module.get<HexesService>(HexesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
