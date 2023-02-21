import { Test, TestingModule } from '@nestjs/testing';
import { ObjectActionHandlerService } from './object-action-handler';

describe('ObjectActionHandlerService', () => {
  let service: ObjectActionHandlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ObjectActionHandlerService],
    }).compile();

    service = module.get<ObjectActionHandlerService>(
      ObjectActionHandlerService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
