import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Equipment } from '../equipments/entities/equipment.entity';
import { MemberPackage } from '../member-packages/entities/member-package.entity';
import { Member } from '../members/entities/member.entity';
import { TrainerProfile } from '../trainer-profiles/entities/trainer-profile.entity';
import { GymRoom } from './entities/gym-room.entity';
import { GymBranchesController } from './gym-branches.controller';
import { GymRoomsController } from './gym-rooms.controller';
import { GymRoomsService } from './gym-rooms.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GymRoom,
      TrainerProfile,
      Equipment,
      Member,
      MemberPackage,
    ]),
  ],
  controllers: [GymRoomsController, GymBranchesController],
  providers: [GymRoomsService],
  exports: [GymRoomsService],
})
export class GymRoomsModule {}
