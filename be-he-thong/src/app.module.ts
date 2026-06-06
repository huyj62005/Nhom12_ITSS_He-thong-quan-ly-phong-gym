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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),

        ssl: {
          rejectUnauthorized: false,
        },

        autoLoadEntities: true,
        synchronize: true,
      }),
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