import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Equipment } from '../../equipments/entities/equipment.entity';

@Entity('maintenance_logs')
export class MaintenanceLog {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Equipment, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'equipment_id' })
    equipment?: Equipment;

    @Column({
        name: 'maintenance_date',
        type: 'date',
    })
    maintenanceDate?: Date;

    @Column('text', {
        nullable: true,
    })
    description?: string;

    @Column({
        type: 'decimal',
        precision: 12,
        scale: 2,
        nullable: true,
    })
    cost?: number;

    @Column({
        default: 'completed',
    })
    status?: string;
}