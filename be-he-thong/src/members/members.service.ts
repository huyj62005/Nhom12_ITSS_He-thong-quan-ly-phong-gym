import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { Member } from './entities/member.entity';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';

type MemberPayload = Partial<CreateMemberDto> & {
  email?: string;
  name?: string;
  address?: string;
  gender?: string;
  avatar?: string;
  avatarUrl?: string;
  status?: string;
  membershipStatus?: string;
};

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private readonly membersRepository: Repository<Member>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createMemberDto: CreateMemberDto) {
    const payload = createMemberDto as MemberPayload;
    const user = payload.userId
      ? await this.findUserOrFail(payload.userId)
      : await this.createMemberUser(payload);
    const manager = payload.managedBy
      ? await this.findUserOrFail(payload.managedBy)
      : undefined;

    const member = this.membersRepository.create({
      user,
      manager,
      fullName: payload.fullName ?? payload.name ?? user.fullName ?? '',
      phone: payload.phone ?? user.phone,
      dateOfBirth: payload.dateOfBirth
        ? new Date(payload.dateOfBirth)
        : undefined,
      memberType: payload.memberType ?? 'standard',
      gender: payload.gender,
      address: payload.address,
      avatarUrl: payload.avatarUrl ?? payload.avatar,
      joinDate: new Date(),
      status: payload.status ?? payload.membershipStatus ?? 'expired',
    });

    return this.toMemberResponse(await this.membersRepository.save(member));
  }

  async findAll() {
    const members = await this.membersRepository.find({
      relations: {
        user: true,
        manager: true,
        memberPackages: {
          package: true,
          trainer: true,
        },
      },
      order: {
        id: 'ASC',
      },
    });

    return members.map((member) => this.toMemberResponse(member));
  }

  async findOne(id: number) {
    return this.toMemberResponse(await this.findMemberOrFail(id));
  }

  async update(id: number, updateMemberDto: UpdateMemberDto) {
    const payload = updateMemberDto as MemberPayload;
    const member = await this.findMemberOrFail(id);

    if (payload.userId !== undefined) {
      member.user = await this.findUserOrFail(payload.userId);
    }

    if (payload.managedBy !== undefined) {
      member.manager = payload.managedBy
        ? await this.findUserOrFail(payload.managedBy)
        : undefined;
    }

    if (payload.fullName !== undefined || payload.name !== undefined) {
      member.fullName = payload.fullName ?? payload.name;
      if (member.user) member.user.fullName = member.fullName;
    }
    if (payload.email !== undefined && member.user)
      member.user.email = payload.email;
    if (payload.phone !== undefined) {
      member.phone = payload.phone;
      if (member.user) member.user.phone = payload.phone;
    }
    if (payload.dateOfBirth !== undefined) {
      member.dateOfBirth = payload.dateOfBirth
        ? new Date(payload.dateOfBirth)
        : undefined;
    }
    if (payload.memberType !== undefined)
      member.memberType = payload.memberType;
    if (payload.gender !== undefined) member.gender = payload.gender;
    if (payload.address !== undefined) member.address = payload.address;
    if (payload.avatarUrl !== undefined || payload.avatar !== undefined) {
      member.avatarUrl = payload.avatarUrl ?? payload.avatar;
    }
    if (
      payload.status !== undefined ||
      payload.membershipStatus !== undefined
    ) {
      member.status = payload.status ?? payload.membershipStatus;
    }

    if (member.user) await this.usersRepository.save(member.user);
    return this.toMemberResponse(await this.membersRepository.save(member));
  }

  async remove(id: number) {
    const member = await this.findMemberOrFail(id);
    await this.membersRepository.remove(member);

    return {
      id,
      deleted: true,
    };
  }

  private async createMemberUser(payload: MemberPayload) {
    const email = payload.email?.trim().toLowerCase();
    if (!email) {
      throw new BadRequestException('Member email is required');
    }

    const user = this.usersRepository.create({
      fullName: payload.fullName ?? payload.name ?? email,
      email,
      password: '123456',
      phone: payload.phone,
      role: UserRole.MEMBER,
      status: UserStatus.ACTIVE,
    });

    return this.usersRepository.save(user);
  }

  private async findMemberOrFail(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('Member id is invalid');
    }

    const member = await this.membersRepository.findOne({
      where: {
        id,
      },
      relations: {
        user: true,
        manager: true,
        memberPackages: {
          package: true,
          trainer: true,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }

  private async findUserOrFail(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('User id is invalid');
    }

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

  private toDateString(date?: Date | string) {
    if (!date) return undefined;
    return typeof date === 'string'
      ? date.slice(0, 10)
      : date.toISOString().slice(0, 10);
  }

  private toMemberResponse(member: Member) {
    return {
      id: member.id,
      userId: member.user?.id,
      user: member.user
        ? {
            id: member.user.id,
            fullName: member.user.fullName,
            name: member.user.fullName,
            email: member.user.email,
            phone: member.user.phone,
            role: member.user.role,
            status: member.user.status,
          }
        : undefined,
      fullName: member.fullName ?? member.user?.fullName ?? '',
      name: member.fullName ?? member.user?.fullName ?? '',
      email: member.user?.email ?? '',
      phone: member.phone ?? member.user?.phone ?? '',
      dateOfBirth: this.toDateString(member.dateOfBirth),
      memberType: member.memberType ?? 'standard',
      gender: member.gender,
      address: member.address ?? '',
      avatar: member.avatarUrl,
      avatarUrl: member.avatarUrl,
      joinDate: this.toDateString(member.joinDate),
      status: member.status ?? 'expired',
      membershipStatus: member.status ?? 'expired',
      memberPackages: member.memberPackages,
    };
  }
}
