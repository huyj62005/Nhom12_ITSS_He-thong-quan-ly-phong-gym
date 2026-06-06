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

    @ManyToOne(() => GymPackage)
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
}