import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GymRoom } from '../../gym-rooms/entities/gym-room.entity';

@Entity('equipments')
export class Equipment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    length: 150,
  })
  name?: string;

  @Column({
    name: 'equipment_code',
    nullable: true,
    unique: true,
    length: 20,
  })
  equipmentCode?: string;

  @Column({
    nullable: true,
    length: 100,
  })
  category?: string;

  @Column({
    default: 1,
  })
  quantity?: number;

  @Column({
    nullable: true,
    length: 150,
  })
  position?: string;

  @ManyToOne(() => GymRoom, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'facility_id' })
  gymRoom?: GymRoom | null;

  @Column({
    name: 'purchase_date',
    type: 'date',
    nullable: true,
  })
  purchaseDate?: Date;

  @Column({
    name: 'purchase_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  purchasePrice?: number;

  @Column({
    name: 'last_maintenance_date',
    type: 'date',
    nullable: true,
  })
  lastMaintenanceDate?: Date;

  @Column({
    name: 'next_maintenance_date',
    type: 'date',
    nullable: true,
  })
  nextMaintenanceDate?: Date;

  @Column({
    default: 'available',
  })
  status?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}
