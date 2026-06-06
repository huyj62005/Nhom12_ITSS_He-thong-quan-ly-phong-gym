import { Test, TestingModule } from '@nestjs/testing';
import { WorkoutExercisesController } from './workout-exercises.controller';
import { WorkoutExercisesService } from './workout-exercises.service';

describe('WorkoutExercisesController', () => {
  let controller: WorkoutExercisesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkoutExercisesController],
      providers: [WorkoutExercisesService],
    }).compile();

    controller = module.get<WorkoutExercisesController>(WorkoutExercisesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
