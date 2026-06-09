import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    Column,
} from 'typeorm';
import { Member } from '../../members/entities/member.entity';
import { GymPackage } from '../../gym-packages/entities/gym-package.entity';
import { User } from '../../users/entities/user.entity';

@Entity('member_packages')
export class MemberPackage {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Member)
    @JoinColumn({ name: 'member_id' })
    member?: Member;

    @ManyToOne(() => GymPackage, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'package_id' })
    package?: GymPackage;

    @ManyToOne(() => User, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'trainer_id' })
    trainer?: User;

    @Column({
        name: 'start_date',
        type: 'date',
    })
    startDate?: Date;

    @Column({
        name: 'end_date',
        type: 'date',
    })
    endDate?: Date;

    @Column()
    status?: string;

    @Column({
        name: 'package_name_snapshot',
        nullable: true,
    })
    packageNameSnapshot?: string;

    @Column({
        name: 'package_type_snapshot',
        nullable: true,
    })
    packageTypeSnapshot?: string;

    @Column({
        name: 'package_price_snapshot',
        type: 'decimal',
        precision: 12,
        scale: 2,
        nullable: true,
    })
    packagePriceSnapshot?: number;

    @Column({
        name: 'package_duration_days_snapshot',
        nullable: true,
    })
    packageDurationDaysSnapshot?: number;

    @Column('text', {
        name: 'package_description_snapshot',
        nullable: true,
    })
    packageDescriptionSnapshot?: string;

    @Column('text', {
        name: 'package_benefits_snapshot',
        nullable: true,
    })
    packageBenefitsSnapshot?: string;
}
