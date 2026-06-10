import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Feedback } from './entities/feedback.entity';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';

@Injectable()
export class FeedbacksService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepository: Repository<Feedback>,
  ) {}

  async create(dto: CreateFeedbackDto): Promise<Feedback> {
    const feedback = this.feedbackRepository.create({
      title: dto.title,
      content: dto.content,
      category: dto.category,
      priority: dto.priority,
      status: dto.status,
      adminReply: dto.adminReply,
      resolvedAt: dto.resolvedAt,
      member: {
        id: dto.memberId,
      } as any,
    });

    return this.feedbackRepository.save(feedback);
  }

  async findAll(): Promise<Feedback[]> {
    return this.feedbackRepository.find({
      relations: {
        member: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: number): Promise<Feedback> {
    const feedback = await this.feedbackRepository.findOne({
      where: { id },
      relations: {
        member: true,
      },
    });

    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }

    return feedback;
  }

  async update(id: number, dto: UpdateFeedbackDto): Promise<Feedback> {
    const feedback = await this.findOne(id);

    if (dto.memberId) {
      feedback.member = {
        id: dto.memberId,
      } as any;
    }

    Object.assign(feedback, {
      title: dto.title,
      content: dto.content,
      category: dto.category,
      priority: dto.priority,
      status: dto.status,
      adminReply: dto.adminReply,
      resolvedAt: dto.resolvedAt,
    });

    return this.feedbackRepository.save(feedback);
  }

  async remove(id: number): Promise<void> {
    const feedback = await this.findOne(id);
    await this.feedbackRepository.remove(feedback);
  }
}
