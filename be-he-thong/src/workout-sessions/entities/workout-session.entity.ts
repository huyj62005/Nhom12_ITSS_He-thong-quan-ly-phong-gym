import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';

import { Member } from '../../members/entities/member.entity';
import { User } from '../../users/entities/user.entity';
import { TrainingSchedule } from '../../training-schedules/entities/training-schedule.entity';
import { WorkoutExercise } from '../../workout-exercises/entities/workout-exercise.entity';

@Entity('workout_sessions')
export class WorkoutSession {
    @PrimaryGeneratedColumn()
    id!: number;

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

    @ManyToOne(() => TrainingSchedule, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({
        name: 'training_schedule_id',
    })
    trainingSchedule?: TrainingSchedule;

    @Column('text', {
        nullable: true,
    })
    notes?: string;

    @CreateDateColumn({
        name: 'created_at',
    })
    createdAt?: Date;

    @OneToMany(
        () => WorkoutExercise,
        (workoutExercise) => workoutExercise.session,
    )
    exercises?: WorkoutExercise[];
}