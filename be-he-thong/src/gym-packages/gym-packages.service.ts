import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateGymPackageDto } from './dto/create-gym-package.dto';
import { UpdateGymPackageDto } from './dto/update-gym-package.dto';
import { GymPackage } from './entities/gym-package.entity';
import { MemberPackage } from '../member-packages/entities/member-package.entity';

@Injectable()
export class GymPackagesService {
  private readonly logger = new Logger(GymPackagesService.name);

  constructor(
    @InjectRepository(GymPackage)
    private readonly gymPackagesRepository: Repository<GymPackage>,
    @InjectRepository(MemberPackage)
    private readonly memberPackagesRepository: Repository<MemberPackage>,
  ) {}

  async create(createGymPackageDto: CreateGymPackageDto) {
    try {
      const payload = this.buildPackageEntity(createGymPackageDto);
      const gymPackage = this.gymPackagesRepository.create(payload);
      const savedPackage = await this.gymPackagesRepository.save(gymPackage);

      return this.toPackageResponse(savedPackage);
    } catch (error) {
      this.logAndThrow('create', error);
    }
  }

  async findAll() {
    const packages = await this.gymPackagesRepository.find({
      order: {
        id: 'ASC',
      },
    });

    return packages.map((gymPackage) => this.toPackageResponse(gymPackage));
  }

  async findOne(id: number) {
    return this.toPackageResponse(await this.findPackageOrFail(id));
  }

  async update(id: number, updateGymPackageDto: UpdateGymPackageDto) {
    try {
      const gymPackage = await this.findPackageOrFail(id);

      await this.snapshotMemberPackages(gymPackage);

      const updates = this.buildPackageEntity(
        updateGymPackageDto as Partial<CreateGymPackageDto>,
        true,
      );
      Object.assign(gymPackage, updates);

      const savedPackage = await this.gymPackagesRepository.save(gymPackage);
      return this.toPackageResponse(savedPackage);
    } catch (error) {
      this.logAndThrow('update', error);
    }
  }

  async remove(id: number) {
    try {
      const gymPackage = await this.findPackageOrFail(id);

      await this.snapshotMemberPackages(gymPackage);
      await this.memberPackagesRepository.query(
        'UPDATE member_packages SET package_id = NULL WHERE package_id = $1',
        [id],
      );
      await this.gymPackagesRepository.delete(id);

      return {
        id,
        deleted: true,
      };
    } catch (error) {
      this.logAndThrow('delete', error);
    }
  }

  private logAndThrow(action: string, error: unknown): never {
    const message = error instanceof Error ? error.message : String(error);
    this.logger.error(`[gym-packages:${action}] failed: ${message}`);
    throw error;
  }

  private async findPackageOrFail(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('Package id is invalid');
    }

    const gymPackage = await this.gymPackagesRepository.findOne({
      where: {
        id,
      },
    });

    if (!gymPackage) {
      throw new NotFoundException('Gym package not found');
    }

    return gymPackage;
  }

  private buildPackageEntity(
    dto: Partial<CreateGymPackageDto>,
    isUpdate = false,
  ): Partial<GymPackage> {
    const packageEntity: Partial<GymPackage> = {};

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new BadRequestException('Package name is required');
      }
      packageEntity.name = name;
    } else if (!isUpdate) {
      throw new BadRequestException('Package name is required');
    }

    if (dto.type !== undefined) {
      packageEntity.type = dto.type;
    } else if (!isUpdate) {
      packageEntity.type = 'monthly';
    }

    if (dto.price !== undefined) {
      const price = Number(dto.price);
      if (!Number.isFinite(price) || price < 0) {
        throw new BadRequestException('Package price is invalid');
      }
      packageEntity.price = price;
    } else if (!isUpdate) {
      throw new BadRequestException('Package price is required');
    }

    const durationDays = this.getDurationDays(dto);
    if (durationDays !== undefined) {
      packageEntity.durationDays = durationDays;
    } else if (!isUpdate) {
      throw new BadRequestException('Package duration is required');
    }

    if (dto.description !== undefined) {
      packageEntity.description = dto.description.trim();
    } else if (!isUpdate) {
      packageEntity.description = '';
    }

    const benefits = this.serializeBenefits(dto);
    if (benefits !== undefined) {
      packageEntity.benefits = benefits;
    } else if (!isUpdate) {
      packageEntity.benefits = '[]';
    }

    if (dto.status !== undefined) {
      packageEntity.status = dto.status;
    } else if (dto.isActive !== undefined) {
      packageEntity.status = dto.isActive ? 'active' : 'inactive';
    } else if (!isUpdate) {
      packageEntity.status = 'active';
    }

    return packageEntity;
  }

  private getDurationDays(dto: Partial<CreateGymPackageDto>) {
    const rawDuration = dto.durationDays ?? dto.duration;
    if (rawDuration === undefined) {
      return undefined;
    }

    const durationDays = Number(rawDuration);
    if (!Number.isInteger(durationDays) || durationDays < 1) {
      throw new BadRequestException('Package duration is invalid');
    }

    return durationDays;
  }

  private serializeBenefits(dto: Partial<CreateGymPackageDto>) {
    if (dto.features !== undefined) {
      return JSON.stringify(
        dto.features.map((feature) => feature.trim()).filter(Boolean),
      );
    }

    if (dto.benefits !== undefined) {
      return dto.benefits;
    }

    return undefined;
  }

  private parseBenefits(benefits?: string) {
    if (!benefits) {
      return [];
    }

    try {
      const parsedBenefits = JSON.parse(benefits);
      return Array.isArray(parsedBenefits)
        ? parsedBenefits.filter((benefit) => typeof benefit === 'string')
        : [];
    } catch {
      return benefits
        .split(/\r?\n/)
        .map((benefit) => benefit.trim())
        .filter(Boolean);
    }
  }

  private async snapshotMemberPackages(gymPackage: GymPackage) {
    await this.memberPackagesRepository
      .createQueryBuilder()
      .update(MemberPackage)
      .set({
        packageNameSnapshot: gymPackage.name,
        packageTypeSnapshot: gymPackage.type,
        packagePriceSnapshot: Number(gymPackage.price ?? 0),
        packageDurationDaysSnapshot: gymPackage.durationDays,
        packageDescriptionSnapshot: gymPackage.description,
        packageBenefitsSnapshot: gymPackage.benefits,
      })
      .where('package_id = :packageId', { packageId: gymPackage.id })
      .andWhere('package_name_snapshot IS NULL')
      .execute();
  }

  private toPackageResponse(gymPackage: GymPackage) {
    const features = this.parseBenefits(gymPackage.benefits);

    return {
      id: gymPackage.id,
      name: gymPackage.name,
      type: gymPackage.type,
      price: Number(gymPackage.price ?? 0),
      durationDays: gymPackage.durationDays,
      duration: gymPackage.durationDays,
      description: gymPackage.description ?? '',
      benefits: gymPackage.benefits ?? '',
      features,
      status: gymPackage.status ?? 'active',
      isActive: (gymPackage.status ?? 'active') === 'active',
      createdAt: gymPackage.createdAt,
    };
  }
}
