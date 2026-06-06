import { Injectable } from '@nestjs/common';
import { CreateWorkoutSessionDto } from './dto/create-workout-session.dto';
import { UpdateWorkoutSessionDto } from './dto/update-workout-session.dto';

@Injectable()
export class WorkoutSessionsService {
  create(createWorkoutSessionDto: CreateWorkoutSessionDto) {
    return 'This action adds a new workoutSession';
  }

  findAll() {
    return `This action returns all workoutSessions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} workoutSession`;
  }

  update(id: number, updateWorkoutSessionDto: UpdateWorkoutSessionDto) {
    return `This action updates a #${id} workoutSession`;
  }

  remove(id: number) {
    return `This action removes a #${id} workoutSession`;
  }
}
