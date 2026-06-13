import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMemberPackageDto } from './dto/create-member-package.dto';
import { UpdateMemberPackageDto } from './dto/update-member-package.dto';
import { MemberPackage } from './entities/member-package.entity';
import { Member } from '../members/entities/member.entity';
import { GymPackage } from '../gym-packages/entities/gym-package.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class MemberPackagesService {
  constructor(
    @InjectRepository(MemberPackage)
    private readonly memberPackagesRepository: Repository<MemberPackage>,
    @InjectRepository(Member)
    private readonly membersRepository: Repository<Member>,
    @InjectRepository(GymPackage)
    private readonly gymPackagesRepository: Repository<GymPackage>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createMemberPackageDto: CreateMemberPackageDto) {
    const member = await this.findMemberOrFail(createMemberPackageDto.memberId);
    const gymPackage = await this.findGymPackageOrFail(
      createMemberPackageDto.packageId,
    );
    await this.assertCanCreateMemberPackage(member, gymPackage);

    const trainer = createMemberPackageDto.trainerId
      ? await this.findUserOrFail(createMemberPackageDto.trainerId)
      : undefined;

    const startDate = createMemberPackageDto.startDate
      ? new Date(createMemberPackageDto.startDate)
      : new Date();
    const endDate = createMemberPackageDto.endDate
      ? new Date(createMemberPackageDto.endDate)
      : this.addDays(startDate, gymPackage.durationDays ?? 0);

    const memberPackage = this.memberPackagesRepository.create({
      member,
      package: gymPackage,
      trainer,
      startDate,
      endDate,
      status: createMemberPackageDto.status ?? 'active',
      ...this.createPackageSnapshot(gymPackage),
    });

    const savedMemberPackage =
      await this.memberPackagesRepository.save(memberPackage);

    return this.toMemberPackageResponse(
      await this.findMemberPackageOrFail(savedMemberPackage.id),
    );
  }

  async findAll() {
    const memberPackages = await this.memberPackagesRepository.find({
      relations: {
        member: true,
        package: true,
        trainer: true,
      },
      order: {
        id: 'ASC',
      },
    });

    return memberPackages.map((memberPackage) =>
      this.toMemberPackageResponse(memberPackage),
    );
  }

  async findOne(id: number) {
    return this.toMemberPackageResponse(await this.findMemberPackageOrFail(id));
  }

  async findByMember(memberId: number) {
    await this.findMemberOrFail(memberId);

    const memberPackages = await this.memberPackagesRepository.find({
      where: {
        member: {
          id: memberId,
        },
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

    return memberPackages.map((memberPackage) =>
      this.toMemberPackageResponse(memberPackage),
    );
  }

  async update(id: number, updateMemberPackageDto: UpdateMemberPackageDto) {
    const memberPackage = await this.findMemberPackageOrFail(id);
    const updates =
      updateMemberPackageDto as Partial<CreateMemberPackageDto>;

    if (updates.memberId !== undefined) {
      memberPackage.member = await this.findMemberOrFail(updates.memberId);
    }

    if (updates.packageId !== undefined) {
      const gymPackage = await this.findGymPackageOrFail(updates.packageId);
      memberPackage.package = gymPackage;
      Object.assign(memberPackage, this.createPackageSnapshot(gymPackage));
    }

    if (updates.trainerId !== undefined) {
      memberPackage.trainer = updates.trainerId
        ? await this.findUserOrFail(updates.trainerId)
        : undefined;
    }

    if (updates.startDate !== undefined) {
      memberPackage.startDate = new Date(updates.startDate);
    }

    if (updates.endDate !== undefined) {
      memberPackage.endDate = new Date(updates.endDate);
    }

    if (updates.status !== undefined) {
      memberPackage.status = updates.status;
    }

    const savedMemberPackage =
      await this.memberPackagesRepository.save(memberPackage);

    return this.toMemberPackageResponse(
      await this.findMemberPackageOrFail(savedMemberPackage.id),
    );
  }

  async remove(id: number) {
    const memberPackage = await this.findMemberPackageOrFail(id);
    await this.memberPackagesRepository.remove(memberPackage);

    return {
      id,
      deleted: true,
    };
  }

  private async findMemberPackageOrFail(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('Member package id is invalid');
    }

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

  private async findMemberOrFail(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('Member id is invalid');
    }

    const member = await this.membersRepository.findOne({
      where: {
        id,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }

  private async findGymPackageOrFail(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('Package id is invalid');
    }

    const gymPackage = await this.gymPackagesRepository.findOne({
      where: {
        id,
      },
    });

    if (!gymPackage) {
      throw new NotFoundException('Gym package not found');
    }

    return gymPackage;
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

  private async assertCanCreateMemberPackage(
    member: Member,
    gymPackage: GymPackage,
  ) {
    const activeMemberPackages = await this.memberPackagesRepository.find({
      where: {
        member: {
          id: member.id,
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
      (memberPackage) =>
        !this.isExpired(memberPackage.endDate) &&
        memberPackage.package?.id !== gymPackage.id,
    );

    if (activeDifferentPackage) {
      throw new BadRequestException(
        'Hội viên vẫn còn gói tập đang hiệu lực. Chỉ có thể đổi gói sau khi gói hiện tại hết hạn.',
      );
    }
  }

  private createPackageSnapshot(gymPackage: GymPackage) {
    return {
      packageNameSnapshot: gymPackage.name,
      packageTypeSnapshot: gymPackage.type,
      packagePriceSnapshot: Number(gymPackage.price ?? 0),
      packageDurationDaysSnapshot: gymPackage.durationDays,
      packageDescriptionSnapshot: gymPackage.description,
      packageBenefitsSnapshot: gymPackage.benefits,
    };
  }

  private addDays(date: Date, days: number) {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
  }

  private parseBenefits(benefits?: string) {
    if (!benefits) {
      return [];
    }

    try {
      const parsedBenefits = JSON.parse(benefits);
      return Array.isArray(parsedBenefits)
        ? parsedBenefits.filter((benefit) => typeof benefit === 'string')
        : [];
    } catch {
      return benefits
        .split(/\r?\n/)
        .map((benefit) => benefit.trim())
        .filter(Boolean);
    }
  }

  private toDateString(date?: Date | string) {
    if (!date) {
      return undefined;
    }

    if (typeof date === 'string') {
      return date;
    }

    return date.toISOString().slice(0, 10);
  }

  private isExpired(endDate?: Date | string) {
    const endDateString = this.toDateString(endDate);
    if (!endDateString) {
      return false;
    }

    return endDateString < new Date().toISOString().slice(0, 10);
  }

  private packageChanged(snapshotPackage: any, currentPackage?: any) {
    if (!currentPackage) {
      return false;
    }

    return (
      snapshotPackage.name !== currentPackage.name ||
      snapshotPackage.type !== currentPackage.type ||
      Number(snapshotPackage.price) !== Number(currentPackage.price) ||
      Number(snapshotPackage.durationDays) !==
        Number(currentPackage.durationDays) ||
      snapshotPackage.description !== currentPackage.description ||
      snapshotPackage.benefits !== currentPackage.benefits
    );
  }

  private toCurrentPackageResponse(gymPackage: GymPackage) {
    return {
      id: gymPackage.id,
      name: gymPackage.name,
      type: gymPackage.type,
      price: Number(gymPackage.price ?? 0),
      durationDays: gymPackage.durationDays,
      duration: gymPackage.durationDays,
      description: gymPackage.description ?? '',
      benefits: gymPackage.benefits ?? '',
      features: this.parseBenefits(gymPackage.benefits),
      status: gymPackage.status ?? 'active',
      isActive: (gymPackage.status ?? 'active') === 'active',
    };
  }

  private toMemberPackageResponse(memberPackage: MemberPackage) {
    const snapshotPackage = {
      id: memberPackage.package?.id,
      name:
        memberPackage.packageNameSnapshot ??
        memberPackage.package?.name ??
        'Gói tập đã xóa',
      type: memberPackage.packageTypeSnapshot ?? memberPackage.package?.type,
      price: Number(
        memberPackage.packagePriceSnapshot ?? memberPackage.package?.price ?? 0,
      ),
      durationDays:
        memberPackage.packageDurationDaysSnapshot ??
        memberPackage.package?.durationDays,
      duration:
        memberPackage.packageDurationDaysSnapshot ??
        memberPackage.package?.durationDays,
      description:
        memberPackage.packageDescriptionSnapshot ??
        memberPackage.package?.description ??
        '',
      benefits:
        memberPackage.packageBenefitsSnapshot ??
        memberPackage.package?.benefits ??
        '',
      features: this.parseBenefits(
        memberPackage.packageBenefitsSnapshot ?? memberPackage.package?.benefits,
      ),
    };
    const currentPackage = memberPackage.package
      ? this.toCurrentPackageResponse(memberPackage.package)
      : null;
    const renewalSuggestion =
      this.isExpired(memberPackage.endDate) &&
      this.packageChanged(snapshotPackage, currentPackage)
        ? {
            title: 'Gói tập đã được cập nhật',
            message: `Gói "${snapshotPackage.name}" đã hết hạn. Bạn có thể đăng ký phiên bản mới "${currentPackage?.name}".`,
            package: currentPackage,
          }
        : null;

    return {
      id: memberPackage.id,
      memberId: memberPackage.member?.id,
      trainerId: memberPackage.trainer?.id,
      trainerName: memberPackage.trainer?.fullName,
      packageId: memberPackage.package?.id,
      packageTypeSnapshot:
        memberPackage.packageTypeSnapshot ?? memberPackage.package?.type,
      package: snapshotPackage,
      currentPackage,
      startDate: this.toDateString(memberPackage.startDate),
      endDate: this.toDateString(memberPackage.endDate),
      status: memberPackage.status,
      renewalSuggestion,
    };
  }
}
