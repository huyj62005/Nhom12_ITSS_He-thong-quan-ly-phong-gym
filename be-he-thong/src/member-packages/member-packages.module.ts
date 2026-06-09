import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberPackagesService } from './member-packages.service';
import { MemberPackagesController } from './member-packages.controller';
import { MemberPackage } from './entities/member-package.entity';
import { Member } from '../members/entities/member.entity';
import { GymPackage } from '../gym-packages/entities/gym-package.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MemberPackage, Member, GymPackage, User])],
  controllers: [MemberPackagesController],
  providers: [MemberPackagesService],
})
export class MemberPackagesModule {}
