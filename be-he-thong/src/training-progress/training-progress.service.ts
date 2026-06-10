import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TrainingProgress } from './entities/training-progress.entity';
import { CreateTrainingProgressDto } from './dto/create-training-progress.dto';
import { UpdateTrainingProgressDto } from './dto/update-training-progress.dto';

@Injectable()
export class TrainingProgressService {
  constructor(
    @InjectRepository(TrainingProgress)
    private readonly repo: Repository<TrainingProgress>,
  ) {}

  async create(dto: CreateTrainingProgressDto) {
    const progress = this.repo.create({
      goal: dto.goal,
      bodyWeight: dto.bodyWeight,
      bodyFatPercent: dto.bodyFatPercent,
      evaluation: dto.evaluation,

      member: {
        id: dto.memberId,
      } as any,

      trainingSchedule: dto.trainingScheduleId
        ? ({ id: dto.trainingScheduleId } as any)
        : null,
    });

    return this.repo.save(progress);
  }

  async findAll() {
    return this.repo.find({
      relations: {
        member: true,
        trainingSchedule: true,
      },
      order: {
        id: 'DESC',
      },
    });
  }

  async findOne(id: number) {
    const data = await this.repo.findOne({
      where: { id },
      relations: {
        member: true,
        trainingSchedule: true,
      },
    });

    if (!data) {
      throw new NotFoundException('TrainingProgress not found');
    }

    return data;
  }

  async update(id: number, dto: UpdateTrainingProgressDto) {
    const data = await this.findOne(id);

    if (dto.memberId) {
      data.member = { id: dto.memberId } as any;
    }

    if (dto.trainingScheduleId) {
      data.trainingSchedule = {
        id: dto.trainingScheduleId,
      } as any;
    }

    Object.assign(data, dto);

    return this.repo.save(data);
  }

  async remove(id: number) {
    const data = await this.findOne(id);
    return this.repo.remove(data);
  }
}
