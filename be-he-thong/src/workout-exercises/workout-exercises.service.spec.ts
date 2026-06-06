import { Test, TestingModule } from '@nestjs/testing';
import { WorkoutExercisesService } from './workout-exercises.service';

describe('WorkoutExercisesService', () => {
  let service: WorkoutExercisesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkoutExercisesService],
    }).compile();

    service = module.get<WorkoutExercisesService>(WorkoutExercisesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
