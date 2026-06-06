import { Injectable } from '@nestjs/common';
import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto';
import { UpdateMaintenanceLogDto } from './dto/update-maintenance-log.dto';

@Injectable()
export class MaintenanceLogsService {
  create(createMaintenanceLogDto: CreateMaintenanceLogDto) {
    return 'This action adds a new maintenanceLog';
  }

  findAll() {
    return `This action returns all maintenanceLogs`;
  }

  findOne(id: number) {
    return `This action returns a #${id} maintenanceLog`;
  }

  update(id: number, updateMaintenanceLogDto: UpdateMaintenanceLogDto) {
    return `This action updates a #${id} maintenanceLog`;
  }

  remove(id: number) {
    return `This action removes a #${id} maintenanceLog`;
  }
}
