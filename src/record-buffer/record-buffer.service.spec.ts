import { Test, TestingModule } from '@nestjs/testing';
import { RecordBufferService } from './record-buffer.service';

describe('RecordBufferService', () => {
  let service: RecordBufferService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecordBufferService],
    }).compile();

    service = module.get<RecordBufferService>(RecordBufferService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
