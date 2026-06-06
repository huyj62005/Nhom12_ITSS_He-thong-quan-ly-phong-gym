import { Module } from '@nestjs/common';
import { TrainingSchedulesService } from './training-schedules.service';
import { TrainingSchedulesController } from './training-schedules.controller';

@Module({
  controllers: [TrainingSchedulesController],
  providers: [TrainingSchedulesService],
})
export class TrainingSchedulesModule {}
