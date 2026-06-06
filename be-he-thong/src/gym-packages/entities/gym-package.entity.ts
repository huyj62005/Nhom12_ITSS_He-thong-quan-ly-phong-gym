import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
} from 'typeorm';
import { MemberPackage } from '../../member-packages/entities/member-package.entity';
@Entity('gym_packages')
export class GymPackage {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column()
    type?: string;

    @Column({
        type: 'decimal',
        precision: 12,
        scale: 2,
    })
    price?: number;

    @Column({
        name: 'duration_days',
    })
    durationDays?: number;

    @Column('text', { nullable: true })
    description?: string;

    @Column('text', { nullable: true })
    benefits?: string;

    @Column()
    status?: string;

    @OneToMany(
        () => MemberPackage,
        (memberPackage) => memberPackage.package,
    )
    memberPackages?: MemberPackage[];
}