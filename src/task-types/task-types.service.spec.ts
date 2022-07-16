import { Test, TestingModule } from '@nestjs/testing';
import { TaskTypesService } from './task-types.service';

describe('TaskTypesService', () => {
  let service: TaskTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaskTypesService],
    }).compile();

    service = module.get<TaskTypesService>(TaskTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
