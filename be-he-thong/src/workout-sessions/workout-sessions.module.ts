import { Module } from '@nestjs/common';
import { WorkoutSessionsService } from './workout-sessions.service';
import { WorkoutSessionsController } from './workout-sessions.controller';
import { WorkoutSession } from './entities/workout-session.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { WorkoutExercise } from '../workout-exercises/entities/workout-exercise.entity';
import { TrainingSchedule } from '../training-schedules/entities/training-schedule.entity';
import { Member } from '../members/entities/member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkoutSession,
      User,
      WorkoutExercise,
      TrainingSchedule,
      Member,
    ]),
  ],
  controllers: [WorkoutSessionsController],
  providers: [WorkoutSessionsService],
})
export class WorkoutSessionsModule {}
