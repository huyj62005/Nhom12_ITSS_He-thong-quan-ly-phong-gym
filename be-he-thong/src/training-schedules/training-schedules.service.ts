import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TrainingSchedule } from './entities/training-schedule.entity';
import { CreateTrainingScheduleDto } from './dto/create-training-schedule.dto';
import { UpdateTrainingScheduleDto } from './dto/update-training-schedule.dto';

@Injectable()
export class TrainingSchedulesService {
  constructor(
    @InjectRepository(TrainingSchedule)
    private readonly repo: Repository<TrainingSchedule>,
  ) {}

  // CREATE
  async create(dto: CreateTrainingScheduleDto): Promise<TrainingSchedule> {
    const schedule = this.repo.create({
      type: dto.type,
      startTime: dto.startTime,
      endTime: dto.endTime,
      status: dto.status ?? 'scheduled',

      member: {
        id: dto.memberId,
      } as any,

      trainer: dto.trainerId ? ({ id: dto.trainerId } as any) : null,

      memberPackage: dto.memberPackageId
        ? ({ id: dto.memberPackageId } as any)
        : null,
    });

    return this.repo.save(schedule);
  }

  // GET ALL
  async findAll(): Promise<TrainingSchedule[]> {
    return this.repo.find({
      relations: {
        member: true,
        trainer: true,
        memberPackage: true,
      },
      order: {
        id: 'DESC',
      },
    });
  }

  // GET ONE
  async findOne(id: number): Promise<TrainingSchedule> {
    const schedule = await this.repo.findOne({
      where: { id },
      relations: {
        member: true,
        trainer: true,
        memberPackage: true,
      },
    });

    if (!schedule) {
      throw new NotFoundException(`TrainingSchedule with ID ${id} not found`);
    }

    return schedule;
  }

  // UPDATE
  async update(
    id: number,
    dto: UpdateTrainingScheduleDto,
  ): Promise<TrainingSchedule> {
    const schedule = await this.findOne(id);

    if (dto.memberId) {
      schedule.member = { id: dto.memberId } as any;
    }

    if (dto.trainerId !== undefined) {
      schedule.trainer = dto.trainerId ? ({ id: dto.trainerId } as any) : null;
    }

    if (dto.memberPackageId !== undefined) {
      schedule.memberPackage = dto.memberPackageId
        ? ({ id: dto.memberPackageId } as any)
        : null;
    }

    Object.assign(schedule, {
      type: dto.type,
      startTime: dto.startTime,
      endTime: dto.endTime,
      status: dto.status,
    });

    return this.repo.save(schedule);
  }

  // DELETE
  async remove(id: number): Promise<void> {
    const schedule = await this.findOne(id);
    await this.repo.remove(schedule);
  }

  // OPTIONAL: get by member
  async findByMember(memberId: number): Promise<TrainingSchedule[]> {
    return this.repo.find({
      where: {
        member: {
          id: memberId,
        },
      },
      relations: {
        member: true,
        trainer: true,
        memberPackage: true,
      },
      order: {
        startTime: 'DESC',
      },
    });
  }

  // OPTIONAL: get by trainer
  async findByTrainer(trainerId: number): Promise<TrainingSchedule[]> {
    return this.repo.find({
      where: {
        trainer: {
          id: trainerId,
        },
      },
      relations: {
        member: true,
        trainer: true,
        memberPackage: true,
      },
      order: {
        startTime: 'DESC',
      },
    });
  }
}
