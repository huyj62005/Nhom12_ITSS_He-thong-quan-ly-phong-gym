import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EquipmentsService } from './equipments.service';
import { EquipmentsController } from './equipments.controller';
import { Equipment } from './entities/equipment.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { GymRoom } from '../gym-rooms/entities/gym-room.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Equipment, GymRoom]),
    NotificationsModule,
  ],
  controllers: [EquipmentsController],
  providers: [EquipmentsService],
})
export class EquipmentsModule {}
