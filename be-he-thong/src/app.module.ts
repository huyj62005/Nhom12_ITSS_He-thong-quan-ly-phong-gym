import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { MembersModule } from './members/members.module';
import { TrainerProfilesModule } from './trainer-profiles/trainer-profiles.module';
import { GymPackagesModule } from './gym-packages/gym-packages.module';
import { MemberPackagesModule } from './member-packages/member-packages.module';
import { PaymentsModule } from './payments/payments.module';
import { TrainingSchedulesModule } from './training-schedules/training-schedules.module';
import { TrainingProgressModule } from './training-progress/training-progress.module';
import { EquipmentsModule } from './equipments/equipments.module';
import { MaintenanceLogsModule } from './maintenance-logs/maintenance-logs.module';
import { FeedbacksModule } from './feedbacks/feedbacks.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ExercisesModule } from './exercises/exercises.module';
import { WorkoutSessionsModule } from './workout-sessions/workout-sessions.module';
import { WorkoutExercisesModule } from './workout-exercises/workout-exercises.module';
import { Equipment } from './equipments/entities/equipment.entity';
import { Exercise } from './exercises/entities/exercise.entity';
import { Feedback } from './feedbacks/entities/feedback.entity';
import { GymPackage } from './gym-packages/entities/gym-package.entity';
import { MaintenanceLog } from './maintenance-logs/entities/maintenance-log.entity';
import { MemberPackage } from './member-packages/entities/member-package.entity';
import { Member } from './members/entities/member.entity';
import { Notification } from './notifications/entities/notification.entity';
import { Payment } from './payments/entities/payment.entity';
import { TrainerProfile } from './trainer-profiles/entities/trainer-profile.entity';
import { TrainingProgress } from './training-progress/entities/training-progress.entity';
import { TrainingSchedule } from './training-schedules/entities/training-schedule.entity';
import { User } from './users/entities/user.entity';
import { WorkoutExercise } from './workout-exercises/entities/workout-exercise.entity';
import { WorkoutSession } from './workout-sessions/entities/workout-session.entity';

const typeOrmEntities = [
  Equipment,
  Exercise,
  Feedback,
  GymPackage,
  MaintenanceLog,
  MemberPackage,
  Member,
  Notification,
  Payment,
  TrainerProfile,
  TrainingProgress,
  TrainingSchedule,
  User,
  WorkoutExercise,
  WorkoutSession,
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        console.log(
          `[be-he-thong] TypeORM config: DATABASE_URL=${databaseUrl ? 'present' : 'missing'}, entities=${typeOrmEntities.length}`,
        );

        return {
          type: 'postgres',
          url: databaseUrl,

          ssl: {
            rejectUnauthorized: false,
          },

          entities: typeOrmEntities,
          autoLoadEntities: true,
          synchronize: true,
        };
      },
    }),

    UsersModule,

    MembersModule,

    TrainerProfilesModule,

    GymPackagesModule,

    MemberPackagesModule,

    PaymentsModule,

    TrainingSchedulesModule,

    TrainingProgressModule,

    EquipmentsModule,

    MaintenanceLogsModule,

    FeedbacksModule,

    NotificationsModule,

    ExercisesModule,

    WorkoutSessionsModule,

    WorkoutExercisesModule,
  ],
})
export class AppModule {}
