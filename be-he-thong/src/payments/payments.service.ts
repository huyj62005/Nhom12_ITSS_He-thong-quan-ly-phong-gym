import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment } from './entities/payment.entity';
import { Member } from '../members/entities/member.entity';
import { MemberPackage } from '../member-packages/entities/member-package.entity';

type PaymentPayload = Partial<CreatePaymentDto> & {
  status?: string;
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
      status: payload.status ?? 'paid',
    });

    return this.toPaymentResponse(await this.paymentsRepository.save(payment));
  }

  async findAll() {
    const payments = await this.paymentsRepository.find({
      relations: {
        member: {
          user: true,
        },
        memberPackage: {
          package: true,
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

    if (payload.memberId !== undefined) {
      payment.member = await this.findMemberOrFail(payload.memberId);
    }
    if (payload.memberPackageId !== undefined) {
      payment.memberPackage = payload.memberPackageId
        ? await this.findMemberPackageOrFail(payload.memberPackageId)
        : undefined;
    }
    if (payload.amount !== undefined) payment.amount = Number(payload.amount);
    if (payload.method !== undefined) payment.method = payload.method;
    if (payload.status !== undefined) payment.status = payload.status;

    return this.toPaymentResponse(await this.paymentsRepository.save(payment));
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
          package: true,
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
        package: true,
      },
    });

    if (!memberPackage) {
      throw new NotFoundException('Member package not found');
    }

    return memberPackage;
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
}
