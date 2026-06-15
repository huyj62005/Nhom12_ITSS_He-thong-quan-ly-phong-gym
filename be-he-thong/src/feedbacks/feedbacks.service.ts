import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { Feedback } from './entities/feedback.entity';
import { Member } from '../members/entities/member.entity';

type FeedbackPayload = Partial<CreateFeedbackDto> & {
  priority?: string;
  status?: string;
  adminReply?: string;
  admin_reply?: string;
  response?: string;
  resolvedAt?: string | Date;
  resolved_at?: string | Date;
};

@Injectable()
export class FeedbacksService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbacksRepository: Repository<Feedback>,
    @InjectRepository(Member)
    private readonly membersRepository: Repository<Member>,
  ) {}

  async create(createFeedbackDto: CreateFeedbackDto) {
    const payload = createFeedbackDto as FeedbackPayload;
    const feedback = this.feedbacksRepository.create({
      member: await this.findMemberOrFail(payload.memberId),
      title: payload.title,
      content: payload.content ?? '',
      category: payload.category,
      priority: payload.priority ?? 'medium',
      status: payload.status ?? 'pending',
    });

    return this.toFeedbackResponse(await this.feedbacksRepository.save(feedback));
  }

  async findAll() {
    const feedbacks = await this.feedbacksRepository.find({
      relations: {
        member: {
          user: true,
        },
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
    }
    if (payload.title !== undefined) feedback.title = payload.title;
    if (payload.content !== undefined) feedback.content = payload.content;
    if (payload.category !== undefined) feedback.category = payload.category;
    if (payload.priority !== undefined) feedback.priority = payload.priority;
    if (payload.status !== undefined) feedback.status = payload.status;
    const adminReply = payload.adminReply ?? payload.admin_reply ?? payload.response;
    if (adminReply !== undefined) feedback.adminReply = adminReply;
    const resolvedAt = payload.resolvedAt ?? payload.resolved_at;
    if (resolvedAt !== undefined) {
      feedback.resolvedAt = resolvedAt ? new Date(resolvedAt) : undefined;
    } else if (payload.status === 'resolved' && !feedback.resolvedAt) {
      feedback.resolvedAt = new Date();
    }

    return this.toFeedbackResponse(await this.feedbacksRepository.save(feedback));
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
        },
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
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member;
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
      adminReply: feedback.adminReply,
      response: feedback.adminReply,
      createdAt: this.toDateString(feedback.createdAt),
      resolvedAt: this.toDateString(feedback.resolvedAt),
    };
  }
}
