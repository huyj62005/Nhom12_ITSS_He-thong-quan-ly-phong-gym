import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { Member } from './entities/member.entity';
import { User } from '../users/entities/user.entity';
import { GymRoom } from '../gym-rooms/entities/gym-room.entity';
import { GymRoomsModule } from '../gym-rooms/gym-rooms.module';

@Module({
  imports: [TypeOrmModule.forFeature([Member, User, GymRoom]), GymRoomsModule],
  controllers: [MembersController],
  providers: [MembersService],
})
export class MembersModule {}
