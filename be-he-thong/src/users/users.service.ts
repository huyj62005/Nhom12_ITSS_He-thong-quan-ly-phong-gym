import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserStatus } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const user = this.usersRepository.create({
      fullName: createUserDto.fullName,
      email: createUserDto.email,
      password: createUserDto.password,
      phone: createUserDto.phone,
      role: createUserDto.role as any,
      status: UserStatus.ACTIVE,
    });

    return this.toUserResponse(await this.usersRepository.save(user));
  }

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();
    const user = await this.usersRepository.findOne({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user || user.password !== normalizedPassword) {
      throw new UnauthorizedException('Email or password is incorrect');
    }

    if (user.status === UserStatus.BLOCKED || user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('User account is not active');
    }

    return this.toUserResponse(user);
  }

  async findAll() {
    const users = await this.usersRepository.find({
      order: {
        id: 'ASC',
      },
    });

    return users.map((user) => this.toUserResponse(user));
  }

  async findOne(id: number) {
    return this.toUserResponse(await this.findUserOrFail(id));
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findUserOrFail(id);
    Object.assign(user, {
      fullName: updateUserDto.fullName ?? user.fullName,
      email: updateUserDto.email ?? user.email,
      password: updateUserDto.password ?? user.password,
      phone: updateUserDto.phone ?? user.phone,
      role: (updateUserDto.role as any) ?? user.role,
    });

    return this.toUserResponse(await this.usersRepository.save(user));
  }

  async remove(id: number) {
    const user = await this.findUserOrFail(id);
    await this.usersRepository.remove(user);

    return {
      id,
      deleted: true,
    };
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

  private toUserResponse(user: User) {
    return {
      id: String(user.id),
      email: user.email ?? '',
      name: user.fullName ?? '',
      fullName: user.fullName ?? '',
      role: user.role ?? 'member',
      phone: user.phone ?? '',
      status: user.status ?? UserStatus.ACTIVE,
      createdAt:
        user.createdAt instanceof Date
          ? user.createdAt.toISOString()
          : new Date().toISOString(),
    };
  }
}
