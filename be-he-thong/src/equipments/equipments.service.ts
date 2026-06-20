import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { Equipment } from './entities/equipment.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { UserRole } from '../users/entities/user.entity';
import { GymRoom } from '../gym-rooms/entities/gym-room.entity';

type EquipmentStatus = 'available' | 'maintenance' | 'broken';

@Injectable()
export class EquipmentsService {
  private readonly logger = new Logger(EquipmentsService.name);
  private readonly validStatuses: EquipmentStatus[] = [
    'available',
    'maintenance',
    'broken',
  ];

  constructor(
    @InjectRepository(Equipment)
    private readonly equipmentsRepository: Repository<Equipment>,
    @InjectRepository(GymRoom)
    private readonly gymRoomsRepository: Repository<GymRoom>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createEquipmentDto: CreateEquipmentDto) {
    try {
      const payload = this.buildEquipmentEntity(createEquipmentDto);
      payload.equipmentCode =
        payload.equipmentCode ??
        (await this.generateEquipmentCode(payload.category ?? ''));
      await this.applyGymRoom(payload, createEquipmentDto);
      const equipment = this.equipmentsRepository.create(payload);
      const savedEquipment = await this.equipmentsRepository.save(equipment);
      await this.notifyEquipmentAttention(savedEquipment);

      return this.toEquipmentResponse(savedEquipment);
    } catch (error) {
      this.logAndThrow('create', error);
    }
  }

  async findAll() {
    await this.markOverdueMaintenance();

    const equipments = await this.equipmentsRepository.find({
      order: {
        id: 'ASC',
      },
      relations: {
        gymRoom: true,
      },
    });

    return equipments.map((equipment) => this.toEquipmentResponse(equipment));
  }

  async findOne(id: number) {
    await this.markOverdueMaintenance();

    return this.toEquipmentResponse(await this.findEquipmentOrFail(id));
  }

  async update(id: number, updateEquipmentDto: UpdateEquipmentDto) {
    try {
      const equipment = await this.findEquipmentOrFail(id);
      const updates = this.buildEquipmentEntity(
        updateEquipmentDto as Partial<CreateEquipmentDto>,
        true,
        equipment,
      );
      if (
        updates.category &&
        updates.category !== equipment.category &&
        !updates.equipmentCode
      ) {
        updates.equipmentCode = await this.generateEquipmentCode(
          updates.category,
          equipment.id,
        );
      }
      Object.assign(equipment, updates);
      await this.applyGymRoom(
        equipment,
        updateEquipmentDto as Partial<CreateEquipmentDto>,
      );

      const savedEquipment = await this.equipmentsRepository.save(equipment);
      await this.notifyEquipmentAttention(savedEquipment);
      return this.toEquipmentResponse(savedEquipment);
    } catch (error) {
      this.logAndThrow('update', error);
    }
  }

  async remove(id: number) {
    try {
      const equipment = await this.findEquipmentOrFail(id);
      await this.equipmentsRepository.remove(equipment);

      return {
        id,
        deleted: true,
      };
    } catch (error) {
      this.logAndThrow('delete', error);
    }
  }

  private async findEquipmentOrFail(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('Equipment id is invalid');
    }

    const equipment = await this.equipmentsRepository.findOne({
      where: {
        id,
      },
      relations: {
        gymRoom: true,
      },
    });

    if (!equipment) {
      throw new NotFoundException('Equipment not found');
    }

    return equipment;
  }

  private async applyGymRoom(
    equipment: Partial<Equipment>,
    dto: Partial<CreateEquipmentDto>,
  ) {
    const gymRoomId = dto.gymRoomId ?? dto.facilityId;
    if (gymRoomId === undefined) return;

    const gymRoom = await this.gymRoomsRepository.findOne({
      where: {
        id: Number(gymRoomId),
      },
    });

    if (!gymRoom) {
      throw new BadRequestException('Gym room not found');
    }

    equipment.gymRoom = gymRoom;
    equipment.position = gymRoom.code ?? `CS${gymRoom.id}`;
  }

  private buildEquipmentEntity(
    dto: Partial<CreateEquipmentDto>,
    isUpdate = false,
    currentEquipment?: Equipment,
  ): Partial<Equipment> {
    const equipment: Partial<Equipment> = {};

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new BadRequestException('Equipment name is required');
      }
      if (name.length > 150) {
        throw new BadRequestException(
          'Equipment name must be at most 150 characters',
        );
      }
      equipment.name = name;
    } else if (!isUpdate) {
      throw new BadRequestException('Equipment name is required');
    }

    const equipmentCode = dto.equipmentCode ?? dto.code;
    if (equipmentCode !== undefined) {
      const normalizedCode = equipmentCode.trim().toUpperCase();
      if (normalizedCode.length > 20) {
        throw new BadRequestException(
          'Equipment code must be at most 20 characters',
        );
      }
      equipment.equipmentCode = normalizedCode || undefined;
    }

    if (dto.category !== undefined) {
      const category = dto.category.trim();
      if (!category) {
        throw new BadRequestException('Equipment category is required');
      }
      if (category.length > 100) {
        throw new BadRequestException(
          'Equipment category must be at most 100 characters',
        );
      }
      equipment.category = category;
    } else if (!isUpdate) {
      throw new BadRequestException('Equipment category is required');
    }

    if (dto.quantity !== undefined) {
      const quantity = Number(dto.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new BadRequestException('Equipment quantity must be at least 1');
      }
      equipment.quantity = quantity;
    } else if (!isUpdate) {
      equipment.quantity = 1;
    }

    if (dto.position !== undefined) {
      const position = dto.position.trim();
      if (position.length > 150) {
        throw new BadRequestException(
          'Equipment position must be at most 150 characters',
        );
      }
      equipment.position = position || undefined;
    }

    const purchaseDate = this.parseDate(dto.purchaseDate);
    if (purchaseDate) {
      if (this.isAfterToday(purchaseDate)) {
        throw new BadRequestException('Purchase date cannot be in the future');
      }
      equipment.purchaseDate = purchaseDate;
    } else if (!isUpdate) {
      throw new BadRequestException('Purchase date is required');
    }

    const purchasePrice = dto.purchasePrice ?? dto.cost;
    if (purchasePrice !== undefined) {
      const price = Number(purchasePrice);
      if (!Number.isFinite(price) || price < 0) {
        throw new BadRequestException('Equipment price must be at least 0');
      }
      equipment.purchasePrice = price;
    } else if (!isUpdate) {
      throw new BadRequestException('Equipment price is required');
    }

    const lastMaintenanceDate = this.parseDate(
      dto.lastMaintenanceDate ?? dto.lastMaintenance,
    );
    if (lastMaintenanceDate) {
      if (this.isAfterToday(lastMaintenanceDate)) {
        throw new BadRequestException(
          'Last maintenance date cannot be in the future',
        );
      }
      equipment.lastMaintenanceDate = lastMaintenanceDate;
    }

    const nextMaintenanceDate = this.parseDate(
      dto.nextMaintenanceDate ?? dto.nextMaintenance,
    );
    if (nextMaintenanceDate) {
      equipment.nextMaintenanceDate = nextMaintenanceDate;
    }

    const effectivePurchaseDate =
      equipment.purchaseDate ?? currentEquipment?.purchaseDate;
    const effectiveLastMaintenanceDate =
      equipment.lastMaintenanceDate ?? currentEquipment?.lastMaintenanceDate;
    const effectiveNextMaintenanceDate =
      equipment.nextMaintenanceDate ?? currentEquipment?.nextMaintenanceDate;

    if (
      effectivePurchaseDate &&
      effectiveLastMaintenanceDate &&
      this.compareDateOnly(
        effectiveLastMaintenanceDate,
        effectivePurchaseDate,
      ) < 0
    ) {
      throw new BadRequestException(
        'Last maintenance date cannot be before purchase date',
      );
    }

    if (
      effectivePurchaseDate &&
      effectiveNextMaintenanceDate &&
      this.compareDateOnly(
        effectiveNextMaintenanceDate,
        effectivePurchaseDate,
      ) < 0
    ) {
      throw new BadRequestException(
        'Next maintenance date cannot be before purchase date',
      );
    }

    if (
      effectiveLastMaintenanceDate &&
      effectiveNextMaintenanceDate &&
      this.compareDateOnly(
        effectiveNextMaintenanceDate,
        effectiveLastMaintenanceDate,
      ) < 0
    ) {
      throw new BadRequestException(
        'Next maintenance date cannot be before last maintenance date',
      );
    }

    if (dto.status !== undefined) {
      if (!this.validStatuses.includes(dto.status as EquipmentStatus)) {
        throw new BadRequestException('Equipment status is invalid');
      }
      equipment.status = dto.status;
    } else if (!isUpdate) {
      equipment.status = 'available';
    }

    const status = (equipment.status ??
      currentEquipment?.status ??
      'available') as EquipmentStatus;
    if (
      status === 'available' &&
      effectiveNextMaintenanceDate &&
      this.compareDateOnly(effectiveNextMaintenanceDate, this.today()) < 0
    ) {
      equipment.status = 'maintenance';
    }

    return equipment;
  }

  private async generateEquipmentCode(category: string, excludeId?: number) {
    const prefix = this.getEquipmentCodePrefix(category);
    const query = this.equipmentsRepository
      .createQueryBuilder('equipment')
      .select('equipment.equipmentCode', 'equipmentCode')
      .where('equipment.equipmentCode LIKE :pattern', {
        pattern: `${prefix}%`,
      });

    if (excludeId) {
      query.andWhere('equipment.id != :excludeId', { excludeId });
    }

    const rows = await query.getRawMany<{ equipmentCode?: string }>();
    const maxSequence = rows.reduce((max, row) => {
      const match = row.equipmentCode?.match(new RegExp(`^${prefix}(\\d{3})$`));
      if (!match) return max;

      return Math.max(max, Number(match[1]));
    }, 0);

    return `${prefix}${String(maxSequence + 1).padStart(3, '0')}`;
  }

  private getEquipmentCodePrefix(category: string) {
    const normalized = category
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase();

    return (normalized.slice(0, 2) || 'EQ').padEnd(2, 'X');
  }

  private async markOverdueMaintenance() {
    const today = this.toDateString(this.today());
    const result = await this.equipmentsRepository.update(
      {
        status: 'available',
        nextMaintenanceDate: LessThan(today) as any,
      },
      {
        status: 'maintenance',
      },
    );

    if ((result.affected ?? 0) > 0) {
      this.logger.log(
        `[equipments:auto-maintenance] updated=${result.affected}, date=${today}`,
      );
    }
  }

  private parseDate(value?: Date | string) {
    if (!value) {
      return undefined;
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Date value is invalid');
    }

    return new Date(this.toRequiredDateString(date));
  }

  private today() {
    return new Date(new Date().toISOString().slice(0, 10));
  }

  private isAfterToday(date: Date | string) {
    return this.compareDateOnly(date, this.today()) > 0;
  }

  private compareDateOnly(left: Date | string, right: Date | string) {
    const leftDate = this.toRequiredDateString(left);
    const rightDate = this.toRequiredDateString(right);

    return leftDate.localeCompare(rightDate);
  }

  private toRequiredDateString(date: Date | string) {
    return typeof date === 'string'
      ? date.slice(0, 10)
      : date.toISOString().slice(0, 10);
  }

  private toDateString(date?: Date | string) {
    if (!date) {
      return undefined;
    }

    if (typeof date === 'string') {
      return date.slice(0, 10);
    }

    return date.toISOString().slice(0, 10);
  }

  private getMaintenanceState(equipment: Equipment) {
    const nextMaintenanceDate = this.toDateString(
      equipment.nextMaintenanceDate,
    );
    if (!nextMaintenanceDate) {
      return {
        overdue: false,
        dueSoon: false,
        daysUntilMaintenance: null,
      };
    }

    const today = this.today();
    const nextMaintenance = new Date(nextMaintenanceDate);
    const daysUntilMaintenance = Math.ceil(
      (nextMaintenance.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      overdue: daysUntilMaintenance < 0,
      dueSoon: daysUntilMaintenance >= 0 && daysUntilMaintenance <= 7,
      daysUntilMaintenance,
    };
  }

  private toEquipmentResponse(equipment: Equipment) {
    const maintenanceState = this.getMaintenanceState(equipment);

    return {
      id: equipment.id,
      equipmentCode: equipment.equipmentCode ?? '',
      code: equipment.equipmentCode ?? '',
      name: equipment.name ?? '',
      category: equipment.category ?? '',
      quantity: equipment.quantity ?? 1,
      position: equipment.position ?? '',
      gymRoomId: equipment.gymRoom?.id ? String(equipment.gymRoom.id) : '',
      facilityId: equipment.gymRoom?.id ? String(equipment.gymRoom.id) : '',
      gymRoomCode: equipment.gymRoom?.code ?? '',
      gymRoomName: equipment.gymRoom?.name ?? '',
      gymRoomDisplayName: equipment.gymRoom
        ? `${equipment.gymRoom.code ?? `CS${equipment.gymRoom.id}`} - ${equipment.gymRoom.name}`
        : '',
      purchaseDate: this.toDateString(equipment.purchaseDate),
      lastMaintenanceDate: this.toDateString(equipment.lastMaintenanceDate),
      lastMaintenance: this.toDateString(equipment.lastMaintenanceDate),
      nextMaintenanceDate: this.toDateString(equipment.nextMaintenanceDate),
      nextMaintenance: this.toDateString(equipment.nextMaintenanceDate),
      purchasePrice: Number(equipment.purchasePrice ?? 0),
      cost: Number(equipment.purchasePrice ?? 0),
      status: equipment.status ?? 'available',
      maintenanceState,
      needsMaintenanceSoon:
        (equipment.status ?? 'available') === 'available' &&
        maintenanceState.dueSoon,
      createdAt: equipment.createdAt,
      updatedAt: equipment.updatedAt,
    };
  }

  private logAndThrow(action: string, error: unknown): never {
    const message = error instanceof Error ? error.message : String(error);
    this.logger.error(`[equipments:${action}] failed: ${message}`);
    throw error;
  }

  private async notifyEquipmentAttention(equipment: Equipment) {
    const status = equipment.status ?? 'available';
    const maintenanceState = this.getMaintenanceState(equipment);
    const needsAttention =
      status === 'maintenance' ||
      status === 'broken' ||
      maintenanceState.dueSoon;

    if (!needsAttention) return;

    const statusText =
      status === 'broken'
        ? 'đang hỏng'
        : status === 'maintenance'
          ? 'đang bảo trì'
          : 'sắp đến hạn bảo trì';

    await this.notificationsService.createForRoles([UserRole.OWNER], {
      title: 'Thiết bị cần chú ý',
      message: `${equipment.name ?? 'Thiết bị'} ${statusText}.`,
      type: 'equipment_attention',
      targetRoute: '/equipment',
      relatedEntityId: String(equipment.id),
    });
  }
}
