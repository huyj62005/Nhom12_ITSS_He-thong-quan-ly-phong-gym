import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Member } from '../../members/entities/member.entity';
import { GymRoom } from '../../gym-rooms/entities/gym-room.entity';

@Entity('feedbacks')
export class Feedback {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Member, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'member_id' })
  member?: Member;

  @ManyToOne(() => GymRoom, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'facility_id' })
  gymRoom?: GymRoom | null;

  @Column({
    nullable: true,
    length: 200,
  })
  title?: string;

  @Column('text')
  content?: string;

  @Column({
    nullable: true,
    length: 100,
  })
  category?: string;

  @Column({
    default: 'medium',
  })
  priority?: string;

  @Column({
    default: 'pending',
  })
  status?: string;

  @Column('text', {
    name: 'admin_reply',
    nullable: true,
  })
  adminReply?: string;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt?: Date;

  @Column({
    name: 'resolved_at',
    type: 'timestamp',
    nullable: true,
  })
  resolvedAt?: Date;
}
