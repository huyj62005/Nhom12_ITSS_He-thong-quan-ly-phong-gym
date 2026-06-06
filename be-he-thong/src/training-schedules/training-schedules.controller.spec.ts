import { Test, TestingModule } from '@nestjs/testing';
import { TrainingSchedulesController } from './training-schedules.controller';
import { TrainingSchedulesService } from './training-schedules.service';

describe('TrainingSchedulesController', () => {
  let controller: TrainingSchedulesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrainingSchedulesController],
      providers: [TrainingSchedulesService],
    }).compile();

    controller = module.get<TrainingSchedulesController>(TrainingSchedulesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
