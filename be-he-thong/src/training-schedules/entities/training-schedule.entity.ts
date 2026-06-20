import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Member } from '../../members/entities/member.entity';
import { MemberPackage } from '../../member-packages/entities/member-package.entity';
import { User } from '../../users/entities/user.entity';
import { GymRoom } from '../../gym-rooms/entities/gym-room.entity';

@Entity('training_schedules')
export class TrainingSchedule {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => MemberPackage, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'member_package_id' })
  memberPackage?: MemberPackage;

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

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'trainer_id' })
  trainer?: User;

  @Column({
    default: 'PT',
    length: 50,
  })
  type?: string;

  @Column({
    name: 'start_time',
    type: 'timestamp',
  })
  startTime?: Date;

  @Column({
    name: 'end_time',
    type: 'timestamp',
  })
  endTime?: Date;

  @Column({
    default: 'scheduled',
    length: 50,
  })
  status?: string;

  @Column('text', {
    nullable: true,
  })
  notes?: string;

  @Column('text', {
    name: 'approval_history',
    nullable: true,
  })
  approvalHistory?: string;
}
