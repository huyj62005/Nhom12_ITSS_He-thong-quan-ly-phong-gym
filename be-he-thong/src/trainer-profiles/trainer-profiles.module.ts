import { Module } from '@nestjs/common';
import { TrainerProfilesService } from './trainer-profiles.service';
import { TrainerProfilesController } from './trainer-profiles.controller';
import { User } from '../users/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainerProfile } from './entities/trainer-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TrainerProfile, User])],
  controllers: [TrainerProfilesController],
  providers: [TrainerProfilesService],
})
export class TrainerProfilesModule {}
