import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingSchedulesService } from './training-schedules.service';
import { TrainingSchedulesController } from './training-schedules.controller';
import { TrainingSchedule } from './entities/training-schedule.entity';
import { Member } from '../members/entities/member.entity';
import { MemberPackage } from '../member-packages/entities/member-package.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TrainingSchedule, Member, MemberPackage, User]),
    NotificationsModule,
  ],
  controllers: [TrainingSchedulesController],
  providers: [TrainingSchedulesService],
})
export class TrainingSchedulesModule {}
