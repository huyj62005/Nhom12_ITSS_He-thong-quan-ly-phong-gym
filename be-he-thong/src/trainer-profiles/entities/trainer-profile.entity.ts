import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('trainer_profiles')
export class TrainerProfile {
    @PrimaryGeneratedColumn()
    id!: number;

    @OneToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user?: User;

    @Column('text', { nullable: true })
    bio?: string;

    @Column({
        name: 'experience_years',
        default: 0,
    })
    experienceYears?: number;

    @Column({
        type: 'decimal',
        precision: 2,
        scale: 1,
        default: 0,
    })
    rating?: number;

    @Column('text', { nullable: true })
    specialties?: string;

    @Column()
    status?: string;
}