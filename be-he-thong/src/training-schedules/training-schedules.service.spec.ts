import { Test, TestingModule } from '@nestjs/testing';
import { TrainingSchedulesService } from './training-schedules.service';

describe('TrainingSchedulesService', () => {
  let service: TrainingSchedulesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrainingSchedulesService],
    }).compile();

    service = module.get<TrainingSchedulesService>(TrainingSchedulesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
