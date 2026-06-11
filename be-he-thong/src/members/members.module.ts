import { Module } from '@nestjs/common';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { User } from '../users/entities/user.entity';
import { MemberPackage } from '../member-packages/entities/member-package.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from './entities/member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, MemberPackage, Member])],
  controllers: [MembersController],
  providers: [MembersService],
})
export class MembersModule {}
