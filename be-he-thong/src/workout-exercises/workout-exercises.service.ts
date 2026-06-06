import { Injectable } from '@nestjs/common';
import { CreateWorkoutExerciseDto } from './dto/create-workout-exercise.dto';
import { UpdateWorkoutExerciseDto } from './dto/update-workout-exercise.dto';

@Injectable()
export class WorkoutExercisesService {
  create(createWorkoutExerciseDto: CreateWorkoutExerciseDto) {
    return 'This action adds a new workoutExercise';
  }

  findAll() {
    return `This action returns all workoutExercises`;
  }

  findOne(id: number) {
    return `This action returns a #${id} workoutExercise`;
  }

  update(id: number, updateWorkoutExerciseDto: UpdateWorkoutExerciseDto) {
    return `This action updates a #${id} workoutExercise`;
  }

  remove(id: number) {
    return `This action removes a #${id} workoutExercise`;
  }
}
