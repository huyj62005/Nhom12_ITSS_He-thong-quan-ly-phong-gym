import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TrainerProfile } from './entities/trainer-profile.entity';
import { CreateTrainerProfileDto } from './dto/create-trainer-profile.dto';
import { UpdateTrainerProfileDto } from './dto/update-trainer-profile.dto';

@Injectable()
export class TrainerProfilesService {
  constructor(
    @InjectRepository(TrainerProfile)
    private readonly trainerProfileRepository: Repository<TrainerProfile>,
  ) {}

  async create(dto: CreateTrainerProfileDto): Promise<TrainerProfile> {
    const profile = this.trainerProfileRepository.create({
      bio: dto.bio,
      experienceYears: dto.experienceYears,
      rating: dto.rating,
      specialties: dto.specialties,
      status: dto.status,

      user: {
        id: dto.userId,
      } as any,
    });

    return this.trainerProfileRepository.save(profile);
  }

  async findAll(): Promise<TrainerProfile[]> {
    return this.trainerProfileRepository.find({
      relations: {
        user: true,
      },
      order: {
        id: 'ASC',
      },
    });
  }

  async findOne(id: number): Promise<TrainerProfile> {
    const profile = await this.trainerProfileRepository.findOne({
      where: { id },
      relations: {
        user: true,
      },
    });

    if (!profile) {
      throw new NotFoundException(`Trainer profile with ID ${id} not found`);
    }

    return profile;
  }

  async update(
    id: number,
    dto: UpdateTrainerProfileDto,
  ): Promise<TrainerProfile> {
    const profile = await this.findOne(id);

    if (dto.userId) {
      profile.user = {
        id: dto.userId,
      } as any;
    }

    Object.assign(profile, {
      bio: dto.bio,
      experienceYears: dto.experienceYears,
      rating: dto.rating,
      specialties: dto.specialties,
      status: dto.status,
    });

    return this.trainerProfileRepository.save(profile);
  }

  async remove(id: number): Promise<void> {
    const profile = await this.findOne(id);
    await this.trainerProfileRepository.remove(profile);
  }
}
