import { Module } from '@nestjs/common';
import { TrainingProgressService } from './training-progress.service';
import { TrainingProgressController } from './training-progress.controller';
import { Member } from '../members/entities/member.entity';
import { TrainingSchedule } from '../training-schedules/entities/training-schedule.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingProgress } from './entities/training-progress.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Member, TrainingSchedule, TrainingProgress]),
  ],
  controllers: [TrainingProgressController],
  providers: [TrainingProgressService],
})
export class TrainingProgressModule {}
