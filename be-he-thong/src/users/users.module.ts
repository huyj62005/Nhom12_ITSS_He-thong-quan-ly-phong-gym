import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Member } from '../members/entities/member.entity';
import { TrainerProfile } from '../trainer-profiles/entities/trainer-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Notification, Member, TrainerProfile]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
