import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainerProfilesService } from './trainer-profiles.service';
import { TrainerProfilesController } from './trainer-profiles.controller';
import { TrainerProfile } from './entities/trainer-profile.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TrainerProfile, User])],
  controllers: [TrainerProfilesController],
  providers: [TrainerProfilesService],
})
export class TrainerProfilesModule {}
