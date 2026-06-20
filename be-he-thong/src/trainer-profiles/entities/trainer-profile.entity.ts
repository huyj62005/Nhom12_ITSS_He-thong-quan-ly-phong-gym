import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { GymRoom } from '../../gym-rooms/entities/gym-room.entity';

@Entity('trainer_profiles')
export class TrainerProfile {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => GymRoom, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'gym_room_id' })
  gymRoom?: GymRoom | null;

  @Column('text', { nullable: true })
  bio?: string;

  @Column({
    name: 'experience_years',
    default: 0,
  })
  experienceYears?: number;

  @Column({
    type: 'decimal',
    precision: 2,
    scale: 1,
    default: 0,
  })
  rating?: number;

  @Column('text', { nullable: true })
  specialties?: string;

  @Column()
  status?: string;
}
