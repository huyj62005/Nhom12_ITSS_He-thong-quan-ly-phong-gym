import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment } from './entities/payment.entity';
import { Member } from '../members/entities/member.entity';
import { MemberPackage } from '../member-packages/entities/member-package.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { User, UserRole } from '../users/entities/user.entity';

type PaymentPayload = Partial<CreatePaymentDto> & {
  status?: string;
  trainerId?: number;
  trainer_id?: number;
};

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    @InjectRepository(Member)
    private readonly membersRepository: Repository<Member>,
    @InjectRepository(MemberPackage)
    private readonly memberPackagesRepository: Repository<MemberPackage>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createPaymentDto: CreatePaymentDto) {
    const payload = createPaymentDto as PaymentPayload;
    const member = await this.findMemberOrFail(payload.memberId);
    const memberPackage = payload.memberPackageId
      ? await this.findMemberPackageOrFail(payload.memberPackageId)
      : undefined;

    const payment = this.paymentsRepository.create({
      member,
      memberPackage,
      amount: Number(payload.amount ?? 0),
      method: payload.method ?? 'cash',
      status: this.normalizePaymentStatus(payload.status ?? 'paid'),
    });

    if (payment.status === 'paid') {
      await this.activateMemberPackage(memberPackage);
    }
    if (payment.status === 'cancelled') {
      await this.cancelMemberPackage(memberPackage);
    }

    const savedPayment = await this.paymentsRepository.save(payment);
    await this.notifyPaymentCreated(savedPayment);

    return this.toPaymentResponse(savedPayment);
  }

  async findAll() {
    const payments = await this.paymentsRepository.find({
      relations: {
        member: {
          user: true,
        },
        memberPackage: {
          package: true,
          trainer: true,
        },
      },
      order: {
        id: 'ASC',
      },
    });

    return payments.map((payment) => this.toPaymentResponse(payment));
  }

  async findOne(id: number) {
    return this.toPaymentResponse(await this.findPaymentOrFail(id));
  }

  async update(id: number, updatePaymentDto: UpdatePaymentDto) {
    const payload = updatePaymentDto as PaymentPayload;
    const payment = await this.findPaymentOrFail(id);
    const previousStatus = payment.status;

    if (payload.memberId !== undefined) {
      payment.member = await this.findMemberOrFail(payload.memberId);
    }
    if (payload.memberPackageId !== undefined) {
      payment.memberPackage = payload.memberPackageId
        ? await this.findMemberPackageOrFail(payload.memberPackageId)
        : undefined;
    }
    const trainerId = payload.trainerId ?? payload.trainer_id;
    if (trainerId !== undefined) {
      if (!payment.memberPackage) {
        throw new BadRequestException('Member package is required for trainer assignment');
      }
      payment.memberPackage.trainer = trainerId
        ? await this.findUserOrFail(trainerId)
        : undefined;
    }
    if (payload.amount !== undefined) payment.amount = Number(payload.amount);
    if (payload.method !== undefined) payment.method = payload.method;
    if (payload.status !== undefined) {
      payment.status = this.normalizePaymentStatus(payload.status);

      if (payment.status === 'paid') {
        await this.activateMemberPackage(payment.memberPackage);
      }

      if (payment.status === 'cancelled') {
        await this.cancelMemberPackage(payment.memberPackage);
      }
    }

    const savedPayment = await this.paymentsRepository.save(payment);
    if (previousStatus !== savedPayment.status) {
      await this.notifyPaymentStatusChanged(savedPayment);
    }
    if (savedPayment.status === 'paid') {
      await this.notifyTrainerAssigned(savedPayment.memberPackage);
    }

    return this.toPaymentResponse(savedPayment);
  }

  async remove(id: number) {
    const payment = await this.findPaymentOrFail(id);
    await this.paymentsRepository.remove(payment);

    return {
      id,
      deleted: true,
    };
  }

  private async findPaymentOrFail(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('Payment id is invalid');
    }

    const payment = await this.paymentsRepository.findOne({
      where: {
        id,
      },
      relations: {
        member: {
          user: true,
        },
        memberPackage: {
          member: true,
          package: true,
          trainer: true,
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
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

  private normalizePaymentStatus(status?: string) {
    if (status === 'paid' || status === 'completed') {
      return 'paid';
    }

    if (status === 'cancelled' || status === 'failed') {
      return 'cancelled';
    }

    return 'pending';
  }

  private async activateMemberPackage(memberPackage?: MemberPackage) {
    if (!memberPackage) {
      return;
    }

    const memberId = memberPackage.member?.id;
    if (memberId) {
      const activeMemberPackages = await this.memberPackagesRepository.find({
        where: {
          member: {
            id: memberId,
          },
          status: 'active',
        },
        relations: {
          package: true,
        },
        order: {
          endDate: 'DESC',
        },
      });
      const activeDifferentPackage = activeMemberPackages.find(
        (activeMemberPackage) =>
          activeMemberPackage.id !== memberPackage.id &&
          !this.isExpired(activeMemberPackage.endDate) &&
          activeMemberPackage.package?.id !== memberPackage.package?.id,
      );

      if (activeDifferentPackage) {
        throw new BadRequestException(
          'Hội viên vẫn còn gói tập đang hiệu lực. Chỉ có thể đổi gói sau khi gói hiện tại hết hạn.',
        );
      }
    }

    const startDate = new Date();
    memberPackage.status = 'active';
    memberPackage.startDate = startDate;
    memberPackage.endDate = this.addDays(
      startDate,
      Number(
        memberPackage.package?.durationDays ??
          memberPackage.packageDurationDaysSnapshot ??
          0,
      ),
    );

    await this.memberPackagesRepository.save(memberPackage);
  }

  private async cancelMemberPackage(memberPackage?: MemberPackage) {
    if (!memberPackage || memberPackage.status === 'active') {
      return;
    }

    memberPackage.status = 'cancelled';
    await this.memberPackagesRepository.save(memberPackage);
  }

  private addDays(date: Date, days: number) {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
  }

  private isExpired(endDate?: Date | string) {
    const endDateString = this.toDateString(endDate);
    if (!endDateString) {
      return false;
    }

    return endDateString.slice(0, 10) < new Date().toISOString().slice(0, 10);
  }

  private toDateString(date?: Date | string) {
    if (!date) return undefined;
    return typeof date === 'string' ? date : date.toISOString();
  }

  private toPaymentResponse(payment: Payment) {
    const member = payment.member;
    const memberPackage = payment.memberPackage;
    const gymPackage = memberPackage?.package;

    return {
      id: payment.id,
      memberId: member?.id,
      member,
      memberPackageId: memberPackage?.id,
      memberPackage,
      packageId: gymPackage?.id,
      packageName: gymPackage?.name ?? memberPackage?.packageNameSnapshot ?? '',
      amount: Number(payment.amount ?? 0),
      method: payment.method ?? 'cash',
      status: payment.status ?? 'paid',
      paidAt: this.toDateString(payment.paidAt),
      paymentDate: this.toDateString(payment.paidAt),
    };
  }

  private async findUserOrFail(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('Trainer id is invalid');
    }

    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('Trainer not found');
    }

    return user;
  }

  private getPackageName(memberPackage?: MemberPackage) {
    return (
      memberPackage?.package?.name ??
      memberPackage?.packageNameSnapshot ??
      'gói tập'
    );
  }

  private async notifyPaymentCreated(payment: Payment) {
    const memberName = payment.member?.fullName ?? 'Hội viên';
    const packageName = this.getPackageName(payment.memberPackage);

    await this.notificationsService.createForRoles(
      [UserRole.OWNER, UserRole.MANAGER],
      {
        title: 'Đăng ký gói tập mới',
        message: `${memberName} vừa đăng ký ${packageName}.`,
        type: 'payment_created',
        targetRoute: '/payments',
        relatedEntityId: String(payment.id),
      },
    );

    if (payment.status === 'paid') {
      await this.notifyPaymentStatusChanged(payment);
    }
  }

  private async notifyPaymentStatusChanged(payment: Payment) {
    if (payment.status !== 'paid') return;

    await this.notificationsService.createForUser(payment.member?.user?.id, {
      title: 'Gói tập đã được kích hoạt',
      message: 'Gói tập của bạn đã được kích hoạt.',
      type: 'package_activated',
      targetRoute: '/packages',
      relatedEntityId: String(payment.id),
    });
  }

  private async notifyTrainerAssigned(memberPackage?: MemberPackage) {
    const packageType =
      memberPackage?.packageTypeSnapshot ?? memberPackage?.package?.type;
    if (!memberPackage?.trainer?.id || packageType !== 'pt') {
      return;
    }

    await this.notificationsService.createForUser(memberPackage.trainer.id, {
      title: 'Hoi vien moi duoc phan cong',
      message: `Ban vua duoc phan cong phu trach ${memberPackage.member?.fullName ?? 'mot hoi vien'}.`,
      type: 'trainer_assigned',
      targetRoute: '/progress',
      relatedEntityId: String(memberPackage.member?.id ?? ''),
    });
  }
}
