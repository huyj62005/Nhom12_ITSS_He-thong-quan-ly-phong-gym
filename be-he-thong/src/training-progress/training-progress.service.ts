import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTrainingProgressDto } from './dto/create-training-progress.dto';
import { UpdateTrainingProgressDto } from './dto/update-training-progress.dto';
import { TrainingProgress } from './entities/training-progress.entity';
import { Member } from '../members/entities/member.entity';
import { TrainingSchedule } from '../training-schedules/entities/training-schedule.entity';

type ProgressPayload = Partial<CreateTrainingProgressDto> & {
  muscleMass?: number;
  date?: string;
  recordedAt?: string;
};

@Injectable()
export class TrainingProgressService {
  constructor(
    @InjectRepository(TrainingProgress)
    private readonly progressRepository: Repository<TrainingProgress>,
    @InjectRepository(Member)
    private readonly membersRepository: Repository<Member>,
    @InjectRepository(TrainingSchedule)
    private readonly schedulesRepository: Repository<TrainingSchedule>,
  ) {}

  async create(createTrainingProgressDto: CreateTrainingProgressDto) {
    const payload = createTrainingProgressDto as ProgressPayload;
    const progress = this.progressRepository.create({
      member: await this.findMemberOrFail(payload.memberId),
      trainingSchedule: payload.trainingScheduleId
        ? await this.findScheduleOrFail(payload.trainingScheduleId)
        : undefined,
      goal: payload.goal,
      recordedAt: this.toProgressDate(payload.recordedAt ?? payload.date),
      bodyWeight: payload.bodyWeight,
      bodyFatPercent: payload.bodyFatPercent,
      muscleMass: payload.muscleMass,
      evaluation: payload.evaluation,
    });

    return this.toProgressResponse(await this.progressRepository.save(progress));
  }

  async findAll() {
    const progressItems = await this.progressRepository.find({
      relations: {
        member: {
          user: true,
        },
        trainingSchedule: true,
      },
      order: {
        recordedAt: 'DESC',
      },
    });

    return progressItems.map((progress) => this.toProgressResponse(progress));
  }

  async findOne(id: number) {
    return this.toProgressResponse(await this.findProgressOrFail(id));
  }

  async update(id: number, updateTrainingProgressDto: UpdateTrainingProgressDto) {
    const payload = updateTrainingProgressDto as ProgressPayload;
    const progress = await this.findProgressOrFail(id);

    if (payload.memberId !== undefined) {
      progress.member = await this.findMemberOrFail(payload.memberId);
    }
    if (payload.trainingScheduleId !== undefined) {
      progress.trainingSchedule = payload.trainingScheduleId
        ? await this.findScheduleOrFail(payload.trainingScheduleId)
        : undefined;
    }
    if (payload.goal !== undefined) progress.goal = payload.goal;
    if (payload.recordedAt !== undefined || payload.date !== undefined) {
      progress.recordedAt = this.toProgressDate(
        payload.recordedAt ?? payload.date,
      );
    }
    if (payload.bodyWeight !== undefined) progress.bodyWeight = payload.bodyWeight;
    if (payload.bodyFatPercent !== undefined) {
      progress.bodyFatPercent = payload.bodyFatPercent;
    }
    if (payload.muscleMass !== undefined) progress.muscleMass = payload.muscleMass;
    if (payload.evaluation !== undefined) progress.evaluation = payload.evaluation;

    return this.toProgressResponse(await this.progressRepository.save(progress));
  }

  async remove(id: number) {
    const progress = await this.findProgressOrFail(id);
    await this.progressRepository.remove(progress);

    return {
      id,
      deleted: true,
    };
  }

  private async findProgressOrFail(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('Training progress id is invalid');
    }

    const progress = await this.progressRepository.findOne({
      where: {
        id,
      },
      relations: {
        member: {
          user: true,
        },
        trainingSchedule: true,
      },
    });

    if (!progress) {
      throw new NotFoundException('Training progress not found');
    }

    return progress;
  }

  private async findMemberOrFail(id?: number) {
    if (!Number.isInteger(id) || !id || id <= 0) {
      throw new BadRequestException('Member id is invalid');
    }

    const member = await this.membersRepository.findOne({
      where: {
        id,
      },
      relations: {
        user: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }

  private async findScheduleOrFail(id: number) {
    const schedule = await this.schedulesRepository.findOne({
      where: {
        id,
      },
    });

    if (!schedule) {
      throw new NotFoundException('Training schedule not found');
    }

    return schedule;
  }

  private toDateString(date?: Date | string) {
    if (!date) return undefined;
    return typeof date === 'string' ? date : date.toISOString();
  }

  private toDateOnlyString(date?: Date | string) {
    if (!date) return undefined;
    if (typeof date === 'string') return date.slice(0, 10);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toProgressDate(value?: string) {
    if (!value) {
      return new Date();
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Recorded date is invalid');
    }

    return date;
  }

  private toProgressResponse(progress: TrainingProgress) {
    return {
      id: progress.id,
      memberId: progress.member?.id,
      member: progress.member,
      trainingScheduleId: progress.trainingSchedule?.id,
      date: this.toDateOnlyString(progress.recordedAt),
      recordedAt: this.toDateOnlyString(progress.recordedAt),
      goal: progress.goal ?? '',
      weight: Number(progress.bodyWeight ?? 0),
      bodyWeight: Number(progress.bodyWeight ?? 0),
      bodyFat: Number(progress.bodyFatPercent ?? 0),
      bodyFatPercent: Number(progress.bodyFatPercent ?? 0),
      muscleMass: Number(progress.muscleMass ?? 0),
      notes: progress.evaluation ?? progress.goal ?? '',
      evaluation: progress.evaluation ?? '',
      exercises: [],
    };
  }
}
