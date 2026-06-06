import { Test, TestingModule } from '@nestjs/testing';
import { WorkoutSessionsController } from './workout-sessions.controller';
import { WorkoutSessionsService } from './workout-sessions.service';

describe('WorkoutSessionsController', () => {
  let controller: WorkoutSessionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkoutSessionsController],
      providers: [WorkoutSessionsService],
    }).compile();

    controller = module.get<WorkoutSessionsController>(WorkoutSessionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
