import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTrainerProfileDto } from './dto/create-trainer-profile.dto';
import { UpdateTrainerProfileDto } from './dto/update-trainer-profile.dto';
import { TrainerProfile } from './entities/trainer-profile.entity';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { GymRoom } from '../gym-rooms/entities/gym-room.entity';

type TrainerPayload = Partial<CreateTrainerProfileDto> & {
  name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  staffType?: string;
  status?: string;
  gymRoomId?: number | string | null;
};

@Injectable()
export class TrainerProfilesService {
  constructor(
    @InjectRepository(TrainerProfile)
    private readonly trainerProfilesRepository: Repository<TrainerProfile>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(GymRoom)
    private readonly gymRoomsRepository: Repository<GymRoom>,
  ) {}

  async create(createTrainerProfileDto: CreateTrainerProfileDto) {
    const payload = createTrainerProfileDto as TrainerPayload;
    const user = payload.userId
      ? await this.findUserOrFail(payload.userId)
      : await this.createStaffUser(payload);

    const trainerProfile = this.trainerProfilesRepository.create({
      user,
      bio: payload.bio,
      experienceYears: Number(payload.experienceYears ?? 0),
      rating: Number(payload.rating ?? 0),
      specialties: payload.specialties,
      status: payload.status ?? 'active',
      gymRoom:
        payload.gymRoomId !== undefined && payload.gymRoomId !== null
          ? await this.findActiveGymRoomOrFail(Number(payload.gymRoomId))
          : null,
    });

    return this.toTrainerResponse(
      await this.trainerProfilesRepository.save(trainerProfile),
    );
  }

  async findAll() {
    const trainerProfiles = await this.trainerProfilesRepository.find({
      relations: {
        user: true,
        gymRoom: true,
      },
      order: {
        id: 'ASC',
      },
    });

    return trainerProfiles.map((trainerProfile) =>
      this.toTrainerResponse(trainerProfile),
    );
  }

  async findOne(id: number) {
    return this.toTrainerResponse(await this.findTrainerOrFail(id));
  }

  async update(id: number, updateTrainerProfileDto: UpdateTrainerProfileDto) {
    const payload = updateTrainerProfileDto as TrainerPayload;
    const trainerProfile = await this.findTrainerOrFail(id);

    if (payload.userId !== undefined) {
      trainerProfile.user = await this.findUserOrFail(payload.userId);
    }
    if (payload.bio !== undefined) trainerProfile.bio = payload.bio;
    if (payload.experienceYears !== undefined) {
      trainerProfile.experienceYears = Number(payload.experienceYears);
    }
    if (payload.rating !== undefined)
      trainerProfile.rating = Number(payload.rating);
    if (payload.specialties !== undefined)
      trainerProfile.specialties = payload.specialties;
    if (payload.status !== undefined) trainerProfile.status = payload.status;
    if (payload.gymRoomId !== undefined) {
      trainerProfile.gymRoom =
        payload.gymRoomId === null || String(payload.gymRoomId) === ''
          ? null
          : await this.findActiveGymRoomOrFail(Number(payload.gymRoomId));
    }

    if (trainerProfile.user) {
      if (payload.name !== undefined || payload.fullName !== undefined) {
        trainerProfile.user.fullName = payload.fullName ?? payload.name;
      }
      if (payload.email !== undefined)
        trainerProfile.user.email = payload.email;
      if (payload.phone !== undefined)
        trainerProfile.user.phone = payload.phone;
      if (payload.staffType !== undefined) {
        trainerProfile.user.role =
          payload.staffType === 'manager' ? UserRole.MANAGER : UserRole.TRAINER;
      }
      await this.usersRepository.save(trainerProfile.user);
    }

    return this.toTrainerResponse(
      await this.trainerProfilesRepository.save(trainerProfile),
    );
  }

  async remove(id: number) {
    const trainerProfile = await this.findTrainerOrFail(id);
    await this.trainerProfilesRepository.remove(trainerProfile);

    return {
      id,
      deleted: true,
    };
  }

  private async createStaffUser(payload: TrainerPayload) {
    const email = payload.email?.trim().toLowerCase();
    if (!email) {
      throw new BadRequestException('Staff email is required');
    }

    return this.usersRepository.save(
      this.usersRepository.create({
        fullName: payload.fullName ?? payload.name ?? email,
        email,
        password: '123456',
        phone: payload.phone,
        role:
          payload.staffType === 'manager' ? UserRole.MANAGER : UserRole.TRAINER,
        status: UserStatus.ACTIVE,
      }),
    );
  }

  private async findTrainerOrFail(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('Trainer profile id is invalid');
    }

    const trainerProfile = await this.trainerProfilesRepository.findOne({
      where: {
        id,
      },
      relations: {
        user: true,
        gymRoom: true,
      },
    });

    if (!trainerProfile) {
      throw new NotFoundException('Trainer profile not found');
    }

    return trainerProfile;
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

  private async findActiveGymRoomOrFail(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('Gym room id is invalid');
    }

    const gymRoom = await this.gymRoomsRepository.findOne({
      where: {
        id,
      },
    });

    if (!gymRoom) {
      throw new NotFoundException('Gym room not found');
    }

    if (gymRoom.status !== 'active') {
      throw new BadRequestException('Gym room is not active');
    }

    return gymRoom;
  }

  private toTrainerResponse(trainerProfile: TrainerProfile) {
    return {
      id: trainerProfile.id,
      userId: trainerProfile.user?.id,
      user: trainerProfile.user
        ? {
            id: trainerProfile.user.id,
            fullName: trainerProfile.user.fullName,
            name: trainerProfile.user.fullName,
            email: trainerProfile.user.email,
            phone: trainerProfile.user.phone,
            role: trainerProfile.user.role,
            status: trainerProfile.user.status,
          }
        : undefined,
      bio: trainerProfile.bio ?? '',
      gymRoomId: trainerProfile.gymRoom?.id
        ? String(trainerProfile.gymRoom.id)
        : '',
      gymRoomCode: trainerProfile.gymRoom?.code ?? '',
      gymRoomName: trainerProfile.gymRoom?.name ?? '',
      gymRoomDisplayName: trainerProfile.gymRoom
        ? `${trainerProfile.gymRoom.code} - ${trainerProfile.gymRoom.name}`
        : '',
      experienceYears: Number(trainerProfile.experienceYears ?? 0),
      rating: Number(trainerProfile.rating ?? 0),
      specialties: trainerProfile.specialties ?? '',
      specialization: trainerProfile.specialties ?? '',
      status: trainerProfile.status ?? 'active',
    };
  }
}
