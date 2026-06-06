import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from 'typeorm';

@Entity('equipments')
export class Equipment {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        length: 150,
    })
    name?: string;

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
}