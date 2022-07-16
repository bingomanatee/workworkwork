import { Test, TestingModule } from '@nestjs/testing';
import { TaskTypesController } from './task-types.controller';
import { TaskTypesService } from './task-types.service';

describe('TaskTypesController', () => {
  let controller: TaskTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskTypesController],
      providers: [TaskTypesService],
    }).compile();

    controller = module.get<TaskTypesController>(TaskTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
