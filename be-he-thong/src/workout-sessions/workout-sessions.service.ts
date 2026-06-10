import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { WorkoutSession } from './entities/workout-session.entity';
import { CreateWorkoutSessionDto } from './dto/create-workout-session.dto';
import { UpdateWorkoutSessionDto } from './dto/update-workout-session.dto';

@Injectable()
export class WorkoutSessionsService {
  constructor(
    @InjectRepository(WorkoutSession)
    private readonly repo: Repository<WorkoutSession>,
  ) {}

  // CREATE
  async create(dto: CreateWorkoutSessionDto): Promise<WorkoutSession> {
    const session = this.repo.create({
      notes: dto.notes,

      member: {
        id: dto.memberId,
      } as any,

      trainer: dto.trainerId ? ({ id: dto.trainerId } as any) : null,

      trainingSchedule: dto.trainingScheduleId
        ? ({ id: dto.trainingScheduleId } as any)
        : null,
    });

    return this.repo.save(session);
  }

  // FIND ALL
  async findAll(): Promise<WorkoutSession[]> {
    return this.repo.find({
      relations: {
        member: true,
        trainer: true,
        trainingSchedule: true,
        exercises: {
          exercise: true,
        },
      },
      order: {
        id: 'DESC',
      },
    });
  }

  // FIND ONE
  async findOne(id: number): Promise<WorkoutSession> {
    const session = await this.repo.findOne({
      where: { id },
      relations: {
        member: true,
        trainer: true,
        trainingSchedule: true,
        exercises: {
          exercise: true,
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`WorkoutSession with ID ${id} not found`);
    }

    return session;
  }

  // UPDATE
  async update(
    id: number,
    dto: UpdateWorkoutSessionDto,
  ): Promise<WorkoutSession> {
    const session = await this.findOne(id);

    if (dto.memberId) {
      session.member = { id: dto.memberId } as any;
    }

    if (dto.trainerId !== undefined) {
      session.trainer = dto.trainerId ? ({ id: dto.trainerId } as any) : null;
    }

    if (dto.trainingScheduleId !== undefined) {
      session.trainingSchedule = dto.trainingScheduleId
        ? ({ id: dto.trainingScheduleId } as any)
        : null;
    }

    Object.assign(session, {
      notes: dto.notes,
    });

    return this.repo.save(session);
  }

  // DELETE
  async remove(id: number): Promise<void> {
    const session = await this.findOne(id);
    await this.repo.remove(session);
  }

  // OPTIONAL: get sessions by member
  async findByMember(memberId: number): Promise<WorkoutSession[]> {
    return this.repo.find({
      where: {
        member: {
          id: memberId,
        },
      },
      relations: {
        trainer: true,
        trainingSchedule: true,
        exercises: {
          exercise: true,
        },
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // OPTIONAL: get sessions by trainer
  async findByTrainer(trainerId: number): Promise<WorkoutSession[]> {
    return this.repo.find({
      where: {
        trainer: {
          id: trainerId,
        },
      },
      relations: {
        member: true,
        trainingSchedule: true,
        exercises: {
          exercise: true,
        },
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
