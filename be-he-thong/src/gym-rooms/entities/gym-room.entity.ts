import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TrainerProfile } from '../../trainer-profiles/entities/trainer-profile.entity';

@Entity('gym_rooms')
export class GymRoom {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, nullable: true, length: 20 })
  code?: string;

  @Column({ length: 150 })
  name!: string;

  @Column({ name: 'room_type', length: 60 })
  roomType!: string;

  @Column({ type: 'text' })
  address!: string;

  @Column({ default: 'active', length: 30 })
  status!: string;

  @ManyToOne(() => TrainerProfile, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'manager_staff_id' })
  managerStaff?: TrainerProfile | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}
