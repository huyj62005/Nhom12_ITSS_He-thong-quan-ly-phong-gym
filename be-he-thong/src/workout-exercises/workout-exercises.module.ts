import { Module } from '@nestjs/common';
import { WorkoutExercisesService } from './workout-exercises.service';
import { WorkoutExercisesController } from './workout-exercises.controller';
import { Exercise } from '../exercises/entities/exercise.entity';
import { WorkoutSession } from '../workout-sessions/entities/workout-session.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutExercise } from './entities/workout-exercise.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkoutExercise, Exercise, WorkoutSession]),
  ],
  controllers: [WorkoutExercisesController],
  providers: [WorkoutExercisesService],
})
export class WorkoutExercisesModule {}
