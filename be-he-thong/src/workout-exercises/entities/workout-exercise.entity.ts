import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    Column,
} from 'typeorm';

import { WorkoutSession } from '../../workout-sessions/entities/workout-session.entity';
import { Exercise } from '../../exercises/entities/exercise.entity';

@Entity('workout_exercises')
export class WorkoutExercise {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => WorkoutSession, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'session_id' })
    session?: WorkoutSession;

    @ManyToOne(() => Exercise, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'exercise_id' })
    exercise?: Exercise;

    @Column()
    sets?: number;

    @Column()
    reps?: number;

    @Column({
        type: 'decimal',
        precision: 6,
        scale: 2,
        nullable: true,
    })
    weight?: number;

    @Column('text', {
        nullable: true,
    })
    note?: string;
}