import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GymPackagesService } from './gym-packages.service';
import { GymPackagesController } from './gym-packages.controller';
import { GymPackage } from './entities/gym-package.entity';
import { MemberPackage } from '../member-packages/entities/member-package.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GymPackage, MemberPackage])],
  controllers: [GymPackagesController],
  providers: [GymPackagesService],
})
export class GymPackagesModule {}
