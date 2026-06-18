import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTrainingScheduleDto } from './dto/create-training-schedule.dto';
import { UpdateTrainingScheduleDto } from './dto/update-training-schedule.dto';
import { TrainingSchedule } from './entities/training-schedule.entity';
import { Member } from '../members/entities/member.entity';
import { MemberPackage } from '../member-packages/entities/member-package.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

type SchedulePayload = Partial<CreateTrainingScheduleDto> & {
  status?: string;
  notes?: string;
  approvalAction?: ScheduleApprovalAction;
  approvalReason?: string;
};

type ScheduleStatus =
  | 'pending'
  | 'scheduled'
  | 'completed'
  | 'cancelled'
  | 'rejected';

type ScheduleApprovalAction =
  | 'requested'
  | 'accepted'
  | 'rejected'
  | 'resubmitted'
  | 'cancelled';

type ScheduleApprovalHistoryEntry = {
  action: ScheduleApprovalAction;
  status: ScheduleStatus;
  trainerId?: number;
  trainerName?: string;
  reason?: string;
  at: string;
};

const scheduleStatuses: ScheduleStatus[] = [
  'pending',
  'scheduled',
  'completed',
  'cancelled',
  'rejected',
];

const approvalActions: ScheduleApprovalAction[] = [
  'requested',
  'accepted',
  'rejected',
  'resubmitted',
  'cancelled',
];

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
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createTrainingScheduleDto: CreateTrainingScheduleDto) {
    const payload = createTrainingScheduleDto as SchedulePayload;
    const member = await this.findMemberOrFail(payload.memberId);
    const memberPackage = payload.memberPackageId
      ? await this.findMemberPackageOrFail(payload.memberPackageId)
      : undefined;
    const scheduleType = payload.type ?? 'pt';
    const assignment = await this.resolveTrainerAssignment(
      member,
      memberPackage,
      payload.trainerId,
      scheduleType,
    );
    const initialStatus = this.normalizeScheduleStatus(
      payload.status,
      scheduleType === 'pt' && assignment.trainer ? 'pending' : 'scheduled',
    );
    const schedule = this.schedulesRepository.create({
      member,
      memberPackage: assignment.memberPackage,
      trainer: assignment.trainer,
      type: scheduleType,
      startTime: payload.startTime ? new Date(payload.startTime) : new Date(),
      endTime: payload.endTime ? new Date(payload.endTime) : new Date(),
      status: initialStatus,
      notes: payload.notes,
      approvalHistory:
        scheduleType === 'pt' && assignment.trainer
          ? this.stringifyApprovalHistory([
              this.createApprovalHistoryEntry(
                payload.approvalAction === 'resubmitted'
                  ? 'resubmitted'
                  : 'requested',
                initialStatus,
                assignment.trainer,
                payload.approvalReason ?? payload.notes,
              ),
            ])
          : undefined,
    });

    const savedSchedule = await this.schedulesRepository.save(schedule);
    await this.notifySchedule(savedSchedule, 'created');

    return this.toScheduleResponse(savedSchedule);
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
    const previousTrainerId = schedule.trainer?.id;

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
    if (payload.status !== undefined) {
      schedule.status = this.normalizeScheduleStatus(payload.status);
    }
    if (payload.notes !== undefined) schedule.notes = payload.notes;

    if (
      payload.memberId !== undefined ||
      payload.memberPackageId !== undefined ||
      payload.trainerId !== undefined ||
      payload.type !== undefined
    ) {
      const assignment = await this.resolveTrainerAssignment(
        schedule.member,
        schedule.memberPackage,
        schedule.trainer?.id,
        schedule.type,
      );
      schedule.memberPackage = assignment.memberPackage;
      schedule.trainer = assignment.trainer;
    }

    this.applyApprovalAction(schedule, payload, previousTrainerId);

    const savedSchedule = await this.schedulesRepository.save(schedule);
    await this.notifySchedule(savedSchedule, 'updated');

    return this.toScheduleResponse(savedSchedule);
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
      relations: {
        member: true,
        package: true,
        trainer: true,
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

  private async resolveTrainerAssignment(
    member: Member | undefined,
    memberPackage: MemberPackage | undefined,
    trainerId: number | undefined,
    type: string | undefined,
  ) {
    if (type !== 'pt') {
      return {
        memberPackage,
        trainer: trainerId ? await this.findUserOrFail(trainerId) : undefined,
      };
    }

    const ptMemberPackage =
      memberPackage ?? (await this.findActivePtMemberPackage(member?.id));
    const assignedTrainer = ptMemberPackage?.trainer;
    const requestedTrainer = trainerId
      ? await this.findUserOrFail(trainerId)
      : assignedTrainer;

    if (!ptMemberPackage || !requestedTrainer?.id) {
      throw new BadRequestException(
        'Hoi vien chua co goi PT dang hoat dong hoac chua chon PT',
      );
    }

    if (requestedTrainer.role !== 'trainer') {
      throw new BadRequestException('Nguoi duoc chon khong phai la PT');
    }

    return {
      memberPackage: ptMemberPackage,
      trainer: requestedTrainer,
    };
  }

  private async findActivePtMemberPackage(memberId?: number) {
    if (!memberId) {
      return undefined;
    }

    const memberPackages = await this.memberPackagesRepository.find({
      where: {
        member: {
          id: memberId,
        },
        status: 'active',
      },
      relations: {
        member: true,
        package: true,
        trainer: true,
      },
      order: {
        endDate: 'DESC',
      },
    });

    return memberPackages.find(
      (memberPackage) =>
        (memberPackage.packageTypeSnapshot ?? memberPackage.package?.type) ===
          'pt' && !this.isExpired(memberPackage.endDate),
    );
  }

  private isExpired(endDate?: Date | string) {
    const endDateString = this.toDateOnlyString(endDate);
    if (!endDateString) {
      return false;
    }

    return endDateString < new Date().toISOString().slice(0, 10);
  }

  private toDateOnlyString(date?: Date | string) {
    if (!date) return undefined;
    return typeof date === 'string' ? date.slice(0, 10) : date.toISOString().slice(0, 10);
  }

  private toDateTimeString(date?: Date | string) {
    if (!date) return undefined;
    return typeof date === 'string' ? date : date.toISOString();
  }

  private normalizeScheduleStatus(
    status?: string,
    fallback: ScheduleStatus = 'scheduled',
  ): ScheduleStatus {
    return scheduleStatuses.includes(status as ScheduleStatus)
      ? (status as ScheduleStatus)
      : fallback;
  }

  private normalizeApprovalAction(action?: string) {
    return approvalActions.includes(action as ScheduleApprovalAction)
      ? (action as ScheduleApprovalAction)
      : undefined;
  }

  private parseApprovalHistory(value?: string): ScheduleApprovalHistoryEntry[] {
    if (!value) return [];

    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) return [];

      return parsed
        .filter((item): item is Record<string, unknown> => Boolean(item))
        .map((item) => {
          const action = this.normalizeApprovalAction(String(item.action ?? ''));
          const status = this.normalizeScheduleStatus(String(item.status ?? 'pending'), 'pending');
          const entry: ScheduleApprovalHistoryEntry = {
            action: action ?? 'requested',
            status,
            at: String(item.at ?? new Date().toISOString()),
          };
          if (item.trainerId !== undefined) entry.trainerId = Number(item.trainerId);
          if (item.trainerName !== undefined) entry.trainerName = String(item.trainerName);
          if (item.reason !== undefined) entry.reason = String(item.reason);
          return entry;
        });
    } catch {
      return [];
    }
  }

  private stringifyApprovalHistory(history: ScheduleApprovalHistoryEntry[]) {
    return JSON.stringify(history);
  }

  private createApprovalHistoryEntry(
    action: ScheduleApprovalAction,
    status: ScheduleStatus,
    trainer?: User,
    reason?: string,
  ): ScheduleApprovalHistoryEntry {
    const entry: ScheduleApprovalHistoryEntry = {
      action,
      status,
      at: new Date().toISOString(),
    };

    if (trainer?.id !== undefined) entry.trainerId = trainer.id;
    if (trainer?.fullName) entry.trainerName = trainer.fullName;
    if (reason?.trim()) entry.reason = reason.trim();

    return entry;
  }

  private appendApprovalHistory(
    schedule: TrainingSchedule,
    entry: ScheduleApprovalHistoryEntry,
  ) {
    const history = this.parseApprovalHistory(schedule.approvalHistory);
    history.push(entry);
    schedule.approvalHistory = this.stringifyApprovalHistory(history);
  }

  private applyApprovalAction(
    schedule: TrainingSchedule,
    payload: SchedulePayload,
    previousTrainerId?: number,
  ) {
    const explicitAction = this.normalizeApprovalAction(payload.approvalAction);
    const trainerChanged =
      payload.trainerId !== undefined && schedule.trainer?.id !== previousTrainerId;
    const inferredAction =
      !explicitAction && trainerChanged && schedule.status === 'pending'
        ? 'resubmitted'
        : undefined;
    const action = explicitAction ?? inferredAction;

    if (!action) return;

    const statusByAction: Record<ScheduleApprovalAction, ScheduleStatus> = {
      requested: 'pending',
      accepted: 'scheduled',
      rejected: 'rejected',
      resubmitted: 'pending',
      cancelled: 'cancelled',
    };
    const status = statusByAction[action];
    schedule.status = status;
    this.appendApprovalHistory(
      schedule,
      this.createApprovalHistoryEntry(
        action,
        status,
        schedule.trainer,
        payload.approvalReason ?? payload.notes,
      ),
    );
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
      approvalHistory: this.parseApprovalHistory(schedule.approvalHistory),
    };
  }

  private async notifySchedule(
    schedule: TrainingSchedule,
    action: 'created' | 'updated',
  ) {
    const actionText = action === 'created' ? 'được tạo' : 'được cập nhật';
    const memberName = schedule.member?.fullName ?? 'hội viên';
    const startTime = schedule.startTime
      ? new Date(schedule.startTime).toLocaleString('vi-VN')
      : '';

    await this.notificationsService.createForUser(schedule.member?.user?.id, {
      title:
        action === 'created'
          ? 'Lịch tập mới'
          : 'Lịch tập đã được cập nhật',
      message: `Lịch tập của bạn đã ${actionText}${startTime ? `: ${startTime}` : ''}.`,
      type: `schedule_${action}`,
      targetRoute: '/schedules',
      relatedEntityId: String(schedule.id),
    });

    await this.notificationsService.createForUser(schedule.trainer?.id, {
      title:
        action === 'created'
          ? 'Lịch tập mới với hội viên'
          : 'Lịch tập đã được cập nhật',
      message: `Lịch tập với ${memberName} đã ${actionText}${startTime ? `: ${startTime}` : ''}.`,
      type: `schedule_${action}`,
      targetRoute: '/schedules',
      relatedEntityId: String(schedule.id),
    });
  }
}
