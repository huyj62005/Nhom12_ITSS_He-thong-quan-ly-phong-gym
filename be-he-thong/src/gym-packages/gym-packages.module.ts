import { Module } from '@nestjs/common';
import { GymPackagesService } from './gym-packages.service';
import { GymPackagesController } from './gym-packages.controller';

@Module({
  controllers: [GymPackagesController],
  providers: [GymPackagesService],
})
export class GymPackagesModule {}
