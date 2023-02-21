import { Test, TestingModule } from '@nestjs/testing';
import { DemuxService } from './demux.service';

describe('DemuxService', () => {
  let service: DemuxService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DemuxService],
    }).compile();

    service = module.get<DemuxService>(DemuxService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
