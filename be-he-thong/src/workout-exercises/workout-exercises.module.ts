import { Module } from '@nestjs/common';
import { WorkoutExercisesService } from './workout-exercises.service';
import { WorkoutExercisesController } from './workout-exercises.controller';

@Module({
  controllers: [WorkoutExercisesController],
  providers: [WorkoutExercisesService],
})
export class WorkoutExercisesModule {}
