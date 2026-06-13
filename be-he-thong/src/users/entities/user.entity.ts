import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { Member } from '../../members/entities/member.entity';
import { TrainerProfile } from '../../trainer-profiles/entities/trainer-profile.entity';
import { Notification } from '../../notifications/entities/notification.entity';
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  TRAINER = 'trainer',
  MEMBER = 'member',
  CASHIER = 'cashier',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'full_name' })
  fullName?: string;

  @Column({ unique: true })
  email?: string;

  @Column()
  password?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role?: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status?: UserStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @OneToOne(() => Member, (member) => member.user)
  memberId?: Member;

  @OneToOne(() => TrainerProfile, (trainer) => trainer.user)
  trainerProfile?: TrainerProfile;

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications?: Notification[];
}
