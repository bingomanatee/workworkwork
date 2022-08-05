import { Test, TestingModule } from '@nestjs/testing';
import { HexesController } from './hexes.controller';
import { HexesService } from './hexes.service';

describe('HexesController', () => {
  let controller: HexesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HexesController],
      providers: [HexesService],
    }).compile();

    controller = module.get<HexesController>(HexesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
