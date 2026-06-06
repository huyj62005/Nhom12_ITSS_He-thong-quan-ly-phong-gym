import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { TrainingSchedule } from '../training-schedule/training-schedule.entity';
import { Member } from '../member/member.entity';

@Entity('training_progress')
export class TrainingProgress {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => TrainingSchedule, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({
        name: 'training_schedule_id',
    })
    trainingSchedule?: TrainingSchedule;

    @ManyToOne(() => Member, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'member_id' })
    member?: Member;

    @Column('text', {
        nullable: true,
    })
    goal?: string;

    @Column({
        name: 'body_weight',
        type: 'decimal',
        precision: 5,
        scale: 2,
        nullable: true,
    })
    bodyWeight?: number;

    @Column({
        name: 'body_fat_percent',
        type: 'decimal',
        precision: 5,
        scale: 2,
        nullable: true,
    })
    bodyFatPercent?: number;

    @Column('text', {
        nullable: true,
    })
    evaluation?: string;

    @CreateDateColumn({
        name: 'recorded_at',
    })
    recordedAt?: Date;
}