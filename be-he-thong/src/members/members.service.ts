import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Member } from './entities/member.entity';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
  ) {}

  async create(dto: CreateMemberDto): Promise<Member> {
    const member = this.memberRepository.create({
      fullName: dto.fullName,
      phone: dto.phone,
      dateOfBirth: dto.dateOfBirth,
      memberType: dto.memberType,
      joinDate: dto.joinDate,
      status: dto.status,

      user: {
        id: dto.userId,
      } as any,

      manager: dto.managerId ? ({ id: dto.managerId } as any) : null,
    });

    return this.memberRepository.save(member);
  }

  async findAll(): Promise<Member[]> {
    return this.memberRepository.find({
      relations: {
        user: true,
        manager: true,
        memberPackages: true,
      },
    });
  }

  async findOne(id: number): Promise<Member> {
    const member = await this.memberRepository.findOne({
      where: { id },
      relations: {
        user: true,
        manager: true,
        memberPackages: true,
      },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }

    return member;
  }

  async update(id: number, dto: UpdateMemberDto): Promise<Member> {
    const member = await this.findOne(id);

    if (dto.userId) {
      member.user = {
        id: dto.userId,
      } as any;
    }

    if (dto.managerId) {
      member.manager = {
        id: dto.managerId,
      } as any;
    }

    Object.assign(member, {
      fullName: dto.fullName,
      phone: dto.phone,
      dateOfBirth: dto.dateOfBirth,
      memberType: dto.memberType,
      joinDate: dto.joinDate,
      status: dto.status,
    });

    return this.memberRepository.save(member);
  }

  async remove(id: number): Promise<void> {
    const member = await this.findOne(id);
    await this.memberRepository.remove(member);
  }
}
