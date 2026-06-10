import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTrainingScheduleDto } from './dto/create-training-schedule.dto';
import { UpdateTrainingScheduleDto } from './dto/update-training-schedule.dto';
import { TrainingSchedule } from './entities/training-schedule.entity';
import { Member } from '../members/entities/member.entity';
import { MemberPackage } from '../member-packages/entities/member-package.entity';
import { User } from '../users/entities/user.entity';

type SchedulePayload = Partial<CreateTrainingScheduleDto> & {
  status?: string;
  notes?: string;
};

@Injectable()
export class TrainingSchedulesService {
  constructor(
    @InjectRepository(TrainingSchedule)
    private readonly schedulesRepository: Repository<TrainingSchedule>,
    @InjectRepository(Member)
    private readonly membersRepository: Repository<Member>,
    @InjectRepository(MemberPackage)
    private readonly memberPackagesRepository: Repository<MemberPackage>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createTrainingScheduleDto: CreateTrainingScheduleDto) {
    const payload = createTrainingScheduleDto as SchedulePayload;
    const schedule = this.schedulesRepository.create({
      member: await this.findMemberOrFail(payload.memberId),
      memberPackage: payload.memberPackageId
        ? await this.findMemberPackageOrFail(payload.memberPackageId)
        : undefined,
      trainer: payload.trainerId
        ? await this.findUserOrFail(payload.trainerId)
        : undefined,
      type: payload.type ?? 'pt',
      startTime: payload.startTime ? new Date(payload.startTime) : new Date(),
      endTime: payload.endTime ? new Date(payload.endTime) : new Date(),
      status: payload.status ?? 'scheduled',
      notes: payload.notes,
    });

    return this.toScheduleResponse(await this.schedulesRepository.save(schedule));
  }

  async findAll() {
    const schedules = await this.schedulesRepository.find({
      relations: {
        member: {
          user: true,
        },
        memberPackage: true,
        trainer: true,
      },
      order: {
        startTime: 'ASC',
      },
    });

    return schedules.map((schedule) => this.toScheduleResponse(schedule));
  }

  async findOne(id: number) {
    return this.toScheduleResponse(await this.findScheduleOrFail(id));
  }

  async update(id: number, updateTrainingScheduleDto: UpdateTrainingScheduleDto) {
    const payload = updateTrainingScheduleDto as SchedulePayload;
    const schedule = await this.findScheduleOrFail(id);

    if (payload.memberId !== undefined) {
      schedule.member = await this.findMemberOrFail(payload.memberId);
    }
    if (payload.memberPackageId !== undefined) {
      schedule.memberPackage = payload.memberPackageId
        ? await this.findMemberPackageOrFail(payload.memberPackageId)
        : undefined;
    }
    if (payload.trainerId !== undefined) {
      schedule.trainer = payload.trainerId
        ? await this.findUserOrFail(payload.trainerId)
        : undefined;
    }
    if (payload.type !== undefined) schedule.type = payload.type;
    if (payload.startTime !== undefined) schedule.startTime = new Date(payload.startTime);
    if (payload.endTime !== undefined) schedule.endTime = new Date(payload.endTime);
    if (payload.status !== undefined) schedule.status = payload.status;
    if (payload.notes !== undefined) schedule.notes = payload.notes;

    return this.toScheduleResponse(await this.schedulesRepository.save(schedule));
  }

  async remove(id: number) {
    const schedule = await this.findScheduleOrFail(id);
    await this.schedulesRepository.remove(schedule);

    return {
      id,
      deleted: true,
    };
  }

  private async findScheduleOrFail(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('Training schedule id is invalid');
    }

    const schedule = await this.schedulesRepository.findOne({
      where: {
        id,
      },
      relations: {
        member: {
          user: true,
        },
        memberPackage: true,
        trainer: true,
      },
    });

    if (!schedule) {
      throw new NotFoundException('Training schedule not found');
    }

    return schedule;
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

  private async findMemberPackageOrFail(id: number) {
    const memberPackage = await this.memberPackagesRepository.findOne({
      where: {
        id,
      },
    });

    if (!memberPackage) {
      throw new NotFoundException('Member package not found');
    }

    return memberPackage;
  }

  private async findUserOrFail(id: number) {
    const user = await this.usersRepository.findOne({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private toDateTimeString(date?: Date | string) {
    if (!date) return undefined;
    return typeof date === 'string' ? date : date.toISOString();
  }

  private toScheduleResponse(schedule: TrainingSchedule) {
    return {
      id: schedule.id,
      memberId: schedule.member?.id,
      member: schedule.member,
      memberPackageId: schedule.memberPackage?.id,
      trainerId: schedule.trainer?.id,
      trainer: schedule.trainer
        ? {
            id: schedule.trainer.id,
            fullName: schedule.trainer.fullName,
            name: schedule.trainer.fullName,
            email: schedule.trainer.email,
          }
        : undefined,
      type: schedule.type ?? 'pt',
      startTime: this.toDateTimeString(schedule.startTime),
      endTime: this.toDateTimeString(schedule.endTime),
      status: schedule.status ?? 'scheduled',
      notes: schedule.notes,
    };
  }
}
