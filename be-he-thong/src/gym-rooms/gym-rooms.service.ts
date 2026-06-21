import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Equipment } from '../equipments/entities/equipment.entity';
import { MemberPackage } from '../member-packages/entities/member-package.entity';
import { Member } from '../members/entities/member.entity';
import { TrainerProfile } from '../trainer-profiles/entities/trainer-profile.entity';
import { UserRole } from '../users/entities/user.entity';
import { CreateGymRoomDto } from './dto/create-gym-room.dto';
import { UpdateGymRoomDto } from './dto/update-gym-room.dto';
import { GymRoom } from './entities/gym-room.entity';

type GymRoomStatus = 'active' | 'inactive';
type GymRoomType = 'gym' | 'fitness';

@Injectable()
export class GymRoomsService {
  private readonly validStatuses: GymRoomStatus[] = ['active', 'inactive'];
  private readonly validTypes: GymRoomType[] = ['gym', 'fitness'];
  private readonly defaultGymRooms: Array<
    Pick<GymRoom, 'code' | 'name' | 'roomType' | 'address' | 'status'>
  > = [
    {
      code: 'CS1',
      name: 'Gym Cầu Giấy',
      roomType: 'gym',
      address: 'Chưa cập nhật',
      status: 'active',
    },
    {
      code: 'CS2',
      name: 'Gym Đống Đa',
      roomType: 'gym',
      address: 'Chưa cập nhật',
      status: 'active',
    },
    {
      code: 'CS3',
      name: 'Fitness Hai Bà Trưng',
      roomType: 'fitness',
      address: 'Chưa cập nhật',
      status: 'active',
    },
  ];

  constructor(
    @InjectRepository(GymRoom)
    private readonly gymRoomsRepository: Repository<GymRoom>,
    @InjectRepository(TrainerProfile)
    private readonly trainerProfilesRepository: Repository<TrainerProfile>,
    @InjectRepository(Equipment)
    private readonly equipmentsRepository: Repository<Equipment>,
    @InjectRepository(Member)
    private readonly membersRepository: Repository<Member>,
    @InjectRepository(MemberPackage)
    private readonly memberPackagesRepository: Repository<MemberPackage>,
  ) {}

  async create(createGymRoomDto: CreateGymRoomDto) {
    await this.ensureDefaultGymRooms();
    const gymRoom = this.gymRoomsRepository.create({
      ...this.buildGymRoomEntity(createGymRoomDto),
      code: await this.generateNextCode(),
    });
    await this.applyManager(gymRoom, createGymRoomDto.managerStaffId);

    const savedGymRoom = await this.gymRoomsRepository.save(gymRoom);
    await this.syncManagerBranch(savedGymRoom);

    return this.toGymRoomResponse(savedGymRoom);
  }

  async findAll() {
    await this.ensureDefaultAndSyncBranchAssignments();
    const gymRooms = await this.gymRoomsRepository.find({
      relations: {
        managerStaff: {
          user: true,
        },
      },
      order: {
        id: 'ASC',
      },
    });

    return Promise.all(
      gymRooms.map((gymRoom) => this.toGymRoomResponse(gymRoom)),
    );
  }

  async findOne(id: number) {
    await this.ensureDefaultAndSyncBranchAssignments();
    return this.toGymRoomResponse(await this.findGymRoomOrFail(id));
  }

  async ensureDefaultAndSyncBranchAssignments() {
    await this.ensureDefaultGymRooms();
    await this.syncBranchAssignments();
  }

  async update(id: number, updateGymRoomDto: UpdateGymRoomDto) {
    const gymRoom = await this.findGymRoomOrFail(id);
    Object.assign(gymRoom, this.buildGymRoomEntity(updateGymRoomDto, true));
    await this.applyManager(gymRoom, updateGymRoomDto.managerStaffId);

    const savedGymRoom = await this.gymRoomsRepository.save(gymRoom);
    await this.syncManagerBranch(savedGymRoom);

    return this.toGymRoomResponse(savedGymRoom);
  }

  async remove(id: number) {
    const gymRoom = await this.findGymRoomOrFail(id);
    await this.gymRoomsRepository.remove(gymRoom);

    return {
      id,
      deleted: true,
    };
  }

  private async findGymRoomOrFail(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('Gym room id is invalid');
    }

    const gymRoom = await this.gymRoomsRepository.findOne({
      where: {
        id,
      },
      relations: {
        managerStaff: {
          user: true,
        },
      },
    });

    if (!gymRoom) {
      throw new NotFoundException('Gym room not found');
    }

    return gymRoom;
  }

  private buildGymRoomEntity(
    dto: Partial<CreateGymRoomDto>,
    isUpdate = false,
  ): Partial<GymRoom> {
    const gymRoom: Partial<GymRoom> = {};

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) throw new BadRequestException('Gym room name is required');
      if (name.length > 150) {
        throw new BadRequestException(
          'Gym room name must be at most 150 characters',
        );
      }
      gymRoom.name = name;
    } else if (!isUpdate) {
      throw new BadRequestException('Gym room name is required');
    }

    const dtoRoomType = dto.roomType ?? dto.type;
    if (dtoRoomType !== undefined) {
      const roomType = dtoRoomType.trim().toLowerCase();
      if (!roomType) throw new BadRequestException('Gym room type is required');
      if (!this.validTypes.includes(roomType as GymRoomType)) {
        throw new BadRequestException('Gym room type is invalid');
      }
      if (roomType.length > 60) {
        throw new BadRequestException(
          'Gym room type must be at most 60 characters',
        );
      }
      gymRoom.roomType = roomType;
    } else if (!isUpdate) {
      throw new BadRequestException('Gym room type is required');
    }

    if (dto.address !== undefined) {
      const address = dto.address.trim();
      if (!address)
        throw new BadRequestException('Gym room address is required');
      gymRoom.address = address;
    } else if (!isUpdate) {
      throw new BadRequestException('Gym room address is required');
    }

    if (dto.status !== undefined) {
      if (!this.validStatuses.includes(dto.status as GymRoomStatus)) {
        throw new BadRequestException('Gym room status is invalid');
      }
      gymRoom.status = dto.status;
    } else if (!isUpdate) {
      gymRoom.status = 'active';
    }

    return gymRoom;
  }

  private async ensureDefaultGymRooms() {
    for (const defaultGymRoom of this.defaultGymRooms) {
      const existing = await this.gymRoomsRepository.findOne({
        where: {
          code: defaultGymRoom.code,
        },
      });

      if (!existing) {
        await this.gymRoomsRepository.save(
          this.gymRoomsRepository.create(defaultGymRoom),
        );
      } else if (
        existing.name !== defaultGymRoom.name ||
        existing.roomType !== defaultGymRoom.roomType ||
        existing.status !== defaultGymRoom.status
      ) {
        existing.name = defaultGymRoom.name;
        existing.roomType = defaultGymRoom.roomType;
        existing.status = defaultGymRoom.status;
        await this.gymRoomsRepository.save(existing);
      }
    }
  }

  private async generateNextCode() {
    const rows = await this.gymRoomsRepository.find({
      select: {
        code: true,
      },
      where: {
        code: ILike('CS%'),
      },
    });
    const maxSequence = rows.reduce((max, row) => {
      const match = row.code?.match(/^CS(\d+)$/i);
      if (!match) return max;

      return Math.max(max, Number(match[1]));
    }, 0);

    return `CS${maxSequence + 1}`;
  }

  private async applyManager(gymRoom: GymRoom, managerStaffId?: number | null) {
    if (managerStaffId === undefined) return;

    if (managerStaffId === null) {
      gymRoom.managerStaff = null;
      return;
    }

    const managerStaff = await this.trainerProfilesRepository.findOne({
      where: {
        id: managerStaffId,
      },
      relations: {
        user: true,
      },
    });

    if (!managerStaff) {
      throw new NotFoundException('Manager staff not found');
    }

    if (managerStaff.user?.role !== UserRole.MANAGER) {
      throw new BadRequestException('Manager staff must have manager role');
    }

    gymRoom.managerStaff = managerStaff;
  }

  private async syncManagerBranch(gymRoom: GymRoom) {
    if (!gymRoom.managerStaff?.id) return;

    const managerStaff = await this.trainerProfilesRepository.findOne({
      where: {
        id: gymRoom.managerStaff.id,
      },
    });

    if (!managerStaff) return;
    managerStaff.gymRoom = gymRoom;
    await this.trainerProfilesRepository.save(managerStaff);
  }

  private async syncBranchAssignments() {
    const activeGymRooms = await this.gymRoomsRepository.find({
      where: {
        status: 'active',
      },
      order: {
        id: 'ASC',
      },
    });

    if (activeGymRooms.length === 0) return;

    await this.syncEquipmentBranches(activeGymRooms);
    await this.syncMemberBranches(activeGymRooms);
  }

  private async syncEquipmentBranches(activeGymRooms: GymRoom[]) {
    const equipments = await this.equipmentsRepository.find({
      relations: {
        gymRoom: true,
      },
      order: {
        id: 'ASC',
      },
    });

    const changedEquipments: Equipment[] = [];
    equipments
      .filter((equipment) => !equipment.gymRoom?.id)
      .forEach((equipment, index) => {
        const targetGymRoom = activeGymRooms[index % activeGymRooms.length];
        if (equipment.gymRoom?.id !== targetGymRoom.id) {
          equipment.gymRoom = targetGymRoom;
          equipment.position = targetGymRoom.code ?? `CS${targetGymRoom.id}`;
          changedEquipments.push(equipment);
        }
      });

    if (changedEquipments.length > 0) {
      await this.equipmentsRepository.save(changedEquipments);
    }
  }

  private async syncMemberBranches(activeGymRooms: GymRoom[]) {
    const members = await this.membersRepository.find({
      relations: {
        gymRoom: true,
      },
      order: {
        id: 'ASC',
      },
    });
    const activePtMemberPackages = await this.memberPackagesRepository.find({
      where: {
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
    const trainerProfiles = await this.trainerProfilesRepository.find({
      relations: {
        user: true,
        gymRoom: true,
      },
    });
    const trainerBranchByUserId = new Map<number, GymRoom>();

    trainerProfiles.forEach((trainerProfile) => {
      if (
        trainerProfile.user?.role === UserRole.TRAINER &&
        trainerProfile.user.id &&
        trainerProfile.gymRoom?.id
      ) {
        trainerBranchByUserId.set(
          trainerProfile.user.id,
          trainerProfile.gymRoom,
        );
      }
    });

    const today = new Date().toISOString().slice(0, 10);
    const fixedMemberBranch = new Map<number, GymRoom>();
    activePtMemberPackages.forEach((memberPackage) => {
      const memberId = memberPackage.member?.id;
      const trainerId = memberPackage.trainer?.id;
      const packageType =
        memberPackage.packageTypeSnapshot ?? memberPackage.package?.type;
      const endDate =
        memberPackage.endDate instanceof Date
          ? memberPackage.endDate.toISOString().slice(0, 10)
          : String(memberPackage.endDate ?? '').slice(0, 10);

      if (
        memberId &&
        trainerId &&
        packageType === 'pt' &&
        (!endDate || endDate >= today) &&
        !fixedMemberBranch.has(memberId)
      ) {
        const trainerBranch = trainerBranchByUserId.get(trainerId);
        if (trainerBranch) {
          fixedMemberBranch.set(memberId, trainerBranch);
        }
      }
    });

    const memberCounts = new Map<number, number>(
      activeGymRooms.map((gymRoom) => [gymRoom.id, 0]),
    );
    const changedMembers: Member[] = [];
    members.forEach((member) => {
      if (member.gymRoom?.id && memberCounts.has(member.gymRoom.id)) {
        memberCounts.set(
          member.gymRoom.id,
          (memberCounts.get(member.gymRoom.id) ?? 0) + 1,
        );
      }
    });

    members.forEach((member) => {
      const fixedBranch = fixedMemberBranch.get(member.id);
      if (!fixedBranch) return;

      if (member.gymRoom?.id !== fixedBranch.id) {
        if (member.gymRoom?.id && memberCounts.has(member.gymRoom.id)) {
          memberCounts.set(
            member.gymRoom.id,
            Math.max((memberCounts.get(member.gymRoom.id) ?? 0) - 1, 0),
          );
        }
        memberCounts.set(
          fixedBranch.id,
          (memberCounts.get(fixedBranch.id) ?? 0) + 1,
        );
        member.gymRoom = fixedBranch;
        changedMembers.push(member);
      }
    });

    members
      .filter(
        (member) => !fixedMemberBranch.has(member.id) && !member.gymRoom?.id,
      )
      .forEach((member) => {
        const targetGymRoom = activeGymRooms.reduce((lowest, candidate) => {
          const lowestCount = memberCounts.get(lowest.id) ?? 0;
          const candidateCount = memberCounts.get(candidate.id) ?? 0;

          return candidateCount < lowestCount ? candidate : lowest;
        }, activeGymRooms[0]);

        memberCounts.set(
          targetGymRoom.id,
          (memberCounts.get(targetGymRoom.id) ?? 0) + 1,
        );
        if (member.gymRoom?.id !== targetGymRoom.id) {
          member.gymRoom = targetGymRoom;
          changedMembers.push(member);
        }
      });

    if (changedMembers.length > 0) {
      await this.membersRepository.save(changedMembers);
    }
  }

  private async toGymRoomResponse(gymRoom: GymRoom) {
    const code = gymRoom.code ?? `CS${gymRoom.id}`;
    const assignedStaff = await this.trainerProfilesRepository.find({
      where: {
        gymRoom: {
          id: gymRoom.id,
        },
      },
      relations: {
        user: true,
        gymRoom: true,
      },
    });
    const manager =
      gymRoom.managerStaff ??
      assignedStaff.find(
        (staff) =>
          staff.user?.role === UserRole.MANAGER &&
          (staff.status ?? 'active') === 'active',
      );
    const trainerCount = assignedStaff.filter(
      (staff) =>
        staff.user?.role === UserRole.TRAINER &&
        (staff.status ?? 'active') === 'active',
    ).length;
    const equipmentCount = await this.equipmentsRepository.count({
      where: [
        {
          gymRoom: {
            id: gymRoom.id,
          },
        },
        {
          position: code,
        },
        {
          position: gymRoom.name,
        },
        {
          position: String(gymRoom.id),
        },
      ],
    });
    const memberCount = await this.membersRepository.count({
      where: {
        gymRoom: {
          id: gymRoom.id,
        },
      },
    });

    return {
      id: gymRoom.id,
      code,
      name: gymRoom.name,
      roomType: gymRoom.roomType,
      type: gymRoom.roomType,
      address: gymRoom.address,
      managerId: manager?.id ? String(manager.id) : '',
      managerStaffId: manager?.id ? String(manager.id) : '',
      managerName: manager?.user?.fullName ?? '',
      status: gymRoom.status,
      equipmentCount,
      memberCount,
      trainerCount,
      createdAt: gymRoom.createdAt,
      updatedAt: gymRoom.updatedAt,
    };
  }
}
