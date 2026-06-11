import { Module } from '@nestjs/common';
import { MaintenanceLogsService } from './maintenance-logs.service';
import { MaintenanceLogsController } from './maintenance-logs.controller';
import { MaintenanceLog } from './entities/maintenance-log.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Equipment } from '../equipments/entities/equipment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MaintenanceLog, Equipment])],
  controllers: [MaintenanceLogsController],
  providers: [MaintenanceLogsService],
})
export class MaintenanceLogsModule {}
