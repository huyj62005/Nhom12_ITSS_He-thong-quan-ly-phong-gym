import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { Feedback } from './entities/feedback.entity';
import { Member } from '../members/entities/member.entity';
import { GymRoom } from '../gym-rooms/entities/gym-room.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { UserRole } from '../users/entities/user.entity';

type FeedbackPayload = Partial<CreateFeedbackDto> & {
  priority?: string;
  status?: string;
  adminReply?: string;
  admin_reply?: string;
  response?: string;
  resolvedAt?: string | Date;
  resolved_at?: string | Date;
  gymRoomId?: number;
  facilityId?: number;
};

@Injectable()
export class FeedbacksService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbacksRepository: Repository<Feedback>,
    @InjectRepository(Member)
    private readonly membersRepository: Repository<Member>,
    @InjectRepository(GymRoom)
    private readonly gymRoomsRepository: Repository<GymRoom>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createFeedbackDto: CreateFeedbackDto) {
    const payload = createFeedbackDto as FeedbackPayload;
    const member = await this.findMemberOrFail(payload.memberId);
    const feedback = this.feedbacksRepository.create({
      member,
      gymRoom:
        payload.gymRoomId || payload.facilityId
          ? await this.findGymRoomOrFail(
              payload.gymRoomId ?? payload.facilityId,
            )
          : member.gymRoom,
      title: payload.title,
      content: payload.content ?? '',
      category: payload.category,
      priority: payload.priority ?? 'medium',
      status: payload.status ?? 'pending',
    });

    const savedFeedback = await this.feedbacksRepository.save(feedback);
    await this.notificationsService.createForRoles([UserRole.OWNER], {
      title: 'Phản hồi mới',
      message: `${savedFeedback.member?.fullName ?? 'Hội viên'} vừa gửi phản hồi ${savedFeedback.title ? `về ${savedFeedback.title}` : 'mới'}.`,
      type: 'feedback_created',
      targetRoute: '/feedback',
      relatedEntityId: String(savedFeedback.id),
    });

    return this.toFeedbackResponse(savedFeedback);
  }

  async findAll() {
    const feedbacks = await this.feedbacksRepository.find({
      relations: {
        member: {
          user: true,
          gymRoom: true,
        },
        gymRoom: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return feedbacks.map((feedback) => this.toFeedbackResponse(feedback));
  }

  async findOne(id: number) {
    return this.toFeedbackResponse(await this.findFeedbackOrFail(id));
  }

  async update(id: number, updateFeedbackDto: UpdateFeedbackDto) {
    const payload = updateFeedbackDto as FeedbackPayload;
    const feedback = await this.findFeedbackOrFail(id);

    if (payload.memberId !== undefined) {
      feedback.member = await this.findMemberOrFail(payload.memberId);
      feedback.gymRoom = feedback.member.gymRoom;
    }
    if (payload.gymRoomId !== undefined || payload.facilityId !== undefined) {
      feedback.gymRoom = await this.findGymRoomOrFail(
        payload.gymRoomId ?? payload.facilityId,
      );
    }
    if (payload.title !== undefined) feedback.title = payload.title;
    if (payload.content !== undefined) feedback.content = payload.content;
    if (payload.category !== undefined) feedback.category = payload.category;
    if (payload.priority !== undefined) feedback.priority = payload.priority;
    if (payload.status !== undefined) feedback.status = payload.status;
    const adminReply =
      payload.adminReply ?? payload.admin_reply ?? payload.response;
    if (adminReply !== undefined) feedback.adminReply = adminReply;
    const resolvedAt = payload.resolvedAt ?? payload.resolved_at;
    if (resolvedAt !== undefined) {
      feedback.resolvedAt = resolvedAt ? new Date(resolvedAt) : undefined;
    } else if (payload.status === 'resolved' && !feedback.resolvedAt) {
      feedback.resolvedAt = new Date();
    }

    const savedFeedback = await this.feedbacksRepository.save(feedback);

    if (adminReply !== undefined) {
      await this.notificationsService.createForUser(
        savedFeedback.member?.user?.id,
        {
          title: 'Yêu cầu của bạn đã được phản hồi',
          message: 'Yêu cầu của bạn đã được phản hồi.',
          type: 'feedback_replied',
          targetRoute: '/feedback',
          relatedEntityId: String(savedFeedback.id),
        },
      );
    }

    return this.toFeedbackResponse(savedFeedback);
  }

  async remove(id: number) {
    const feedback = await this.findFeedbackOrFail(id);
    await this.feedbacksRepository.remove(feedback);

    return {
      id,
      deleted: true,
    };
  }

  private async findFeedbackOrFail(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('Feedback id is invalid');
    }

    const feedback = await this.feedbacksRepository.findOne({
      where: {
        id,
      },
      relations: {
        member: {
          user: true,
          gymRoom: true,
        },
        gymRoom: true,
      },
    });

    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    return feedback;
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
        gymRoom: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }

  private async findGymRoomOrFail(id?: number) {
    if (!Number.isInteger(id) || !id || id <= 0) {
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

    return gymRoom;
  }

  private toDateString(date?: Date | string) {
    if (!date) return undefined;
    return typeof date === 'string' ? date : date.toISOString();
  }

  private toFeedbackResponse(feedback: Feedback) {
    return {
      id: feedback.id,
      memberId: feedback.member?.id,
      member: feedback.member,
      title: feedback.title ?? '',
      subject: feedback.title ?? '',
      content: feedback.content ?? '',
      message: feedback.content ?? '',
      category: feedback.category,
      priority: feedback.priority ?? 'medium',
      status: feedback.status ?? 'pending',
      gymRoomId: feedback.gymRoom?.id
        ? String(feedback.gymRoom.id)
        : feedback.member?.gymRoom?.id
          ? String(feedback.member.gymRoom.id)
          : '',
      facilityId: feedback.gymRoom?.id
        ? String(feedback.gymRoom.id)
        : feedback.member?.gymRoom?.id
          ? String(feedback.member.gymRoom.id)
          : '',
      gymRoomCode:
        feedback.gymRoom?.code ?? feedback.member?.gymRoom?.code ?? '',
      gymRoomName:
        feedback.gymRoom?.name ?? feedback.member?.gymRoom?.name ?? '',
      gymRoomDisplayName:
        feedback.gymRoom || feedback.member?.gymRoom
          ? `${feedback.gymRoom?.code ?? feedback.member?.gymRoom?.code ?? ''} - ${
              feedback.gymRoom?.name ?? feedback.member?.gymRoom?.name ?? ''
            }`
          : '',
      adminReply: feedback.adminReply,
      response: feedback.adminReply,
      createdAt: this.toDateString(feedback.createdAt),
      resolvedAt: this.toDateString(feedback.resolvedAt),
    };
  }
}
