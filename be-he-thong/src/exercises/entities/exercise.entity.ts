import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
} from 'typeorm';
import { WorkoutExercise } from '../../workout-exercises/entities/workout-exercise.entity';

@Entity('exercises')
export class Exercise {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        length: 150,
    })
    name!: string;

    @Column({
        name: 'muscle_group',
        nullable: true,
        length: 100,
    })
    muscleGroup?: string;

    @Column('text', {
        nullable: true,
    })
    description?: string;

    @Column({
        default: 'active',
        length: 30,
    })
    status?: string;

    @OneToMany(
        () => WorkoutExercise,
        (workoutExercise) => workoutExercise.exercise,
    )
    workoutExercises?: WorkoutExercise[];
}