import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Member } from '../../members/entities/member.entity';
import { MemberPackage } from '../../member-packages/entities/member-package.entity';
import { User } from '../../users/entities/user.entity';

@Entity('training_schedules')
export class TrainingSchedule {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => MemberPackage, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'member_package_id' })
    memberPackage?: MemberPackage;

    @ManyToOne(() => Member, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'member_id' })
    member?: Member;

    @ManyToOne(() => User, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'trainer_id' })
    trainer?: User;

    @Column({
        default: 'PT',
        length: 50,
    })
    type?: string;

    @Column({
        name: 'start_time',
        type: 'timestamp',
    })
    startTime?: Date;

    @Column({
        name: 'end_time',
        type: 'timestamp',
    })
    endTime?: Date;

    @Column({
        default: 'scheduled',
        length: 50,
    })
    status?: string;
}