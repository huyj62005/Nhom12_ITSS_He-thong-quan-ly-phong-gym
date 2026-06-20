import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Member } from '../../members/entities/member.entity';
import { MemberPackage } from '../../member-packages/entities/member-package.entity';
import { GymRoom } from '../../gym-rooms/entities/gym-room.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Member)
  @JoinColumn({ name: 'member_id' })
  member?: Member;

  @ManyToOne(() => GymRoom, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'facility_id' })
  gymRoom?: GymRoom | null;

  @ManyToOne(() => MemberPackage, {
    nullable: true,
  })
  @JoinColumn({
    name: 'member_package_id',
  })
  memberPackage?: MemberPackage;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  amount?: number;

  @Column()
  method?: string;

  @Column()
  status?: string;

  @CreateDateColumn({
    name: 'paid_at',
  })
  paidAt?: Date;
}
