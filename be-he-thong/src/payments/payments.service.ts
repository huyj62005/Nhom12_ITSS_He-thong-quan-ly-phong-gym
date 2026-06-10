import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async create(dto: CreatePaymentDto): Promise<Payment> {
    const payment = this.paymentRepository.create({
      amount: dto.amount,
      method: dto.method,
      status: dto.status,

      member: {
        id: dto.memberId,
      } as any,

      memberPackage: dto.memberPackageId
        ? ({
            id: dto.memberPackageId,
          } as any)
        : null,
    });

    return this.paymentRepository.save(payment);
  }

  async findAll(): Promise<Payment[]> {
    return this.paymentRepository.find({
      relations: {
        member: true,
        memberPackage: true,
      },
      order: {
        paidAt: 'DESC',
      },
    });
  }

  async findOne(id: number): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: {
        member: true,
        memberPackage: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async update(id: number, dto: UpdatePaymentDto): Promise<Payment> {
    const payment = await this.findOne(id);

    if (dto.memberId) {
      payment.member = {
        id: dto.memberId,
      } as any;
    }

    if (dto.memberPackageId) {
      payment.memberPackage = {
        id: dto.memberPackageId,
      } as any;
    }

    Object.assign(payment, {
      amount: dto.amount,
      method: dto.method,
      status: dto.status,
    });

    return this.paymentRepository.save(payment);
  }

  async remove(id: number): Promise<void> {
    const payment = await this.findOne(id);
    await this.paymentRepository.remove(payment);
  }
}
