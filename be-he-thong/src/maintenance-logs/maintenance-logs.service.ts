import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MaintenanceLog } from './entities/maintenance-log.entity';
import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto';
import { UpdateMaintenanceLogDto } from './dto/update-maintenance-log.dto';

@Injectable()
export class MaintenanceLogsService {
  constructor(
    @InjectRepository(MaintenanceLog)
    private readonly maintenanceLogRepository: Repository<MaintenanceLog>,
  ) {}

  async create(dto: CreateMaintenanceLogDto): Promise<MaintenanceLog> {
    const log = this.maintenanceLogRepository.create({
      maintenanceDate: dto.maintenanceDate,
      description: dto.description,
      cost: dto.cost,
      status: dto.status,
      equipment: {
        id: dto.equipmentId,
      } as any,
    });

    return this.maintenanceLogRepository.save(log);
  }

  async findAll(): Promise<MaintenanceLog[]> {
    return this.maintenanceLogRepository.find({
      relations: {
        equipment: true,
      },
      order: {
        id: 'DESC',
      },
    });
  }

  async findOne(id: number): Promise<MaintenanceLog> {
    const log = await this.maintenanceLogRepository.findOne({
      where: { id },
      relations: {
        equipment: true,
      },
    });

    if (!log) {
      throw new NotFoundException(`Maintenance log with ID ${id} not found`);
    }

    return log;
  }

  async update(
    id: number,
    dto: UpdateMaintenanceLogDto,
  ): Promise<MaintenanceLog> {
    const log = await this.findOne(id);

    if (dto.equipmentId) {
      log.equipment = {
        id: dto.equipmentId,
      } as any;
    }

    Object.assign(log, {
      maintenanceDate: dto.maintenanceDate,
      description: dto.description,
      cost: dto.cost,
      status: dto.status,
    });

    return this.maintenanceLogRepository.save(log);
  }

  async remove(id: number): Promise<void> {
    const log = await this.findOne(id);
    await this.maintenanceLogRepository.remove(log);
  }
}
