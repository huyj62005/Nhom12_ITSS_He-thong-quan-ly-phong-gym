import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Notification } from './entities/notification.entity';
import { User, UserRole } from '../users/entities/user.entity';

type NotificationPayload = CreateNotificationDto & {
  userIds?: number[];
};

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto) {
    return this.createForUser(createNotificationDto.userId, createNotificationDto);
  }

  async createForUser(userId: number | undefined, payload: Partial<CreateNotificationDto>) {
    if (!Number.isInteger(userId) || !userId || userId <= 0) {
      return undefined;
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) return undefined;

    const relatedEntityId =
      payload.relatedEntityId === undefined
        ? payload.related_entity_id
        : String(payload.relatedEntityId);
    if (payload.type && relatedEntityId) {
      const existingNotification = await this.notificationsRepository.findOne({
        where: {
          user: { id: userId },
          type: payload.type,
          relatedEntityId,
        },
        relations: { user: true },
      });

      if (existingNotification) {
        return this.toNotificationResponse(existingNotification);
      }
    }

    const notification = this.notificationsRepository.create({
      user,
      title: payload.title?.trim() || 'Thông báo',
      content: (payload.message ?? payload.content ?? '').trim(),
      type: payload.type,
      targetRoute: payload.targetRoute ?? payload.target_route,
      relatedEntityId,
      isRead: false,
    });

    return this.toNotificationResponse(
      await this.notificationsRepository.save(notification),
    );
  }

  async createForUsers(userIds: number[], payload: Partial<CreateNotificationDto>) {
    const uniqueUserIds = Array.from(new Set(userIds.filter((id) => id > 0)));
    const notifications = await Promise.all(
      uniqueUserIds.map((userId) => this.createForUser(userId, payload)),
    );

    return notifications.filter(Boolean);
  }

  async createForRoles(roles: UserRole[], payload: Partial<CreateNotificationDto>) {
    const users = await this.usersRepository.find({
      where: {
        role: In(roles),
      },
    });

    return this.createForUsers(
      users.map((user) => user.id),
      payload,
    );
  }

  async createForRolesInGymRoom(
    roles: UserRole[],
    gymRoomId: number | undefined,
    payload: Partial<CreateNotificationDto>,
  ) {
    if (!Number.isInteger(gymRoomId) || !gymRoomId || gymRoomId <= 0) {
      return [];
    }

    const users = await this.usersRepository.find({
      where: {
        role: In(roles),
      },
      relations: {
        trainerProfile: {
          gymRoom: true,
        },
        member: {
          gymRoom: true,
        },
      },
    });

    return this.createForUsers(
      users
        .filter((user) => {
          const userGymRoomId =
            user.trainerProfile?.gymRoom?.id ?? user.member?.gymRoom?.id;
          return userGymRoomId === gymRoomId;
        })
        .map((user) => user.id),
      payload,
    );
  }

  async findAll() {
    const notifications = await this.notificationsRepository.find({
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });

    return notifications.map((notification) =>
      this.toNotificationResponse(notification),
    );
  }

  async findMine(userId: number) {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new BadRequestException('User id is invalid');
    }

    const notifications = await this.notificationsRepository.find({
      where: {
        user: {
          id: userId,
        },
      },
      relations: { user: true },
      order: { createdAt: 'DESC' },
      take: 30,
    });

    return notifications.map((notification) =>
      this.toNotificationResponse(notification),
    );
  }

  async findOne(id: number) {
    return this.toNotificationResponse(await this.findNotificationOrFail(id));
  }

  async update(id: number, updateNotificationDto: UpdateNotificationDto) {
    const notification = await this.findNotificationOrFail(id);

    if (updateNotificationDto.title !== undefined) {
      notification.title = updateNotificationDto.title;
    }
    if (
      updateNotificationDto.content !== undefined ||
      updateNotificationDto.message !== undefined
    ) {
      notification.content =
        updateNotificationDto.message ?? updateNotificationDto.content;
    }
    if (updateNotificationDto.type !== undefined) {
      notification.type = updateNotificationDto.type;
    }
    if (
      updateNotificationDto.targetRoute !== undefined ||
      updateNotificationDto.target_route !== undefined
    ) {
      notification.targetRoute =
        updateNotificationDto.targetRoute ?? updateNotificationDto.target_route;
    }
    if (
      updateNotificationDto.relatedEntityId !== undefined ||
      updateNotificationDto.related_entity_id !== undefined
    ) {
      notification.relatedEntityId = String(
        updateNotificationDto.relatedEntityId ??
          updateNotificationDto.related_entity_id,
      );
    }

    return this.toNotificationResponse(
      await this.notificationsRepository.save(notification),
    );
  }

  async markAsRead(id: number, userId?: number) {
    const notification = await this.findNotificationOrFail(id);

    if (userId && notification.user?.id !== userId) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    return this.toNotificationResponse(
      await this.notificationsRepository.save(notification),
    );
  }

  async markAllAsRead(userId: number) {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new BadRequestException('User id is invalid');
    }

    await this.notificationsRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true })
      .where('user_id = :userId', { userId })
      .andWhere('is_read = :isRead', { isRead: false })
      .execute();

    return { updated: true };
  }

  async remove(id: number) {
    const notification = await this.findNotificationOrFail(id);
    await this.notificationsRepository.remove(notification);

    return {
      id,
      deleted: true,
    };
  }

  private async findNotificationOrFail(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('Notification id is invalid');
    }

    const notification = await this.notificationsRepository.findOne({
      where: { id },
      relations: { user: true },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  private toDateString(date?: Date | string) {
    if (!date) return undefined;
    return typeof date === 'string' ? date : date.toISOString();
  }

  private toNotificationResponse(notification: Notification) {
    return {
      id: notification.id,
      userId: notification.user?.id,
      title: notification.title ?? '',
      message: notification.content ?? '',
      content: notification.content ?? '',
      type: notification.type ?? '',
      targetRoute: notification.targetRoute ?? '',
      target_route: notification.targetRoute ?? '',
      relatedEntityId: notification.relatedEntityId ?? '',
      related_entity_id: notification.relatedEntityId ?? '',
      isRead: notification.isRead ?? false,
      is_read: notification.isRead ?? false,
      createdAt: this.toDateString(notification.createdAt),
      created_at: this.toDateString(notification.createdAt),
    };
  }
}
