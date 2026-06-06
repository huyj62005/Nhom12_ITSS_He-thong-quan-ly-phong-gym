import { Module } from '@nestjs/common';
import { WorkoutSessionsService } from './workout-sessions.service';
import { WorkoutSessionsController } from './workout-sessions.controller';

@Module({
  controllers: [WorkoutSessionsController],
  providers: [WorkoutSessionsService],
})
export class WorkoutSessionsModule {}
