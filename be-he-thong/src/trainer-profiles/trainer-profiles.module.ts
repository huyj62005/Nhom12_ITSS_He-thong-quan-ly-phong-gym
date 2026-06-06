import { Module } from '@nestjs/common';
import { TrainerProfilesService } from './trainer-profiles.service';
import { TrainerProfilesController } from './trainer-profiles.controller';

@Module({
  controllers: [TrainerProfilesController],
  providers: [TrainerProfilesService],
})
export class TrainerProfilesModule {}
