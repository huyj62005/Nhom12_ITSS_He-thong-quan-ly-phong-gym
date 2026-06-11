import { Module } from '@nestjs/common';
import { TrainingSchedulesService } from './training-schedules.service';
import { TrainingSchedulesController } from './training-schedules.controller';
import { User } from '../users/entities/user.entity';
import { MemberPackage } from '../member-packages/entities/member-package.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from '../members/entities/member.entity';
import { TrainingSchedule } from './entities/training-schedule.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, MemberPackage, Member, TrainingSchedule]),
  ],
  controllers: [TrainingSchedulesController],
  providers: [TrainingSchedulesService],
})
export class TrainingSchedulesModule {}
