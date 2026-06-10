import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingProgressService } from './training-progress.service';
import { TrainingProgressController } from './training-progress.controller';
import { TrainingProgress } from './entities/training-progress.entity';
import { Member } from '../members/entities/member.entity';
import { TrainingSchedule } from '../training-schedules/entities/training-schedule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TrainingProgress, Member, TrainingSchedule])],
  controllers: [TrainingProgressController],
  providers: [TrainingProgressService],
})
export class TrainingProgressModule {}
