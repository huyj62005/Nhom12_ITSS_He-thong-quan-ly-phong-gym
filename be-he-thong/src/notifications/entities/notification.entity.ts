import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @Column({
        length: 200,
    })
    title?: string;

    @Column('text', {
        nullable: true,
    })
    content?: string;

    @Column({
        nullable: true,
        length: 100,
    })
    type?: string;

    @Column({
        name: 'target_route',
        nullable: true,
        length: 200,
    })
    targetRoute?: string;

    @Column({
        name: 'related_entity_id',
        nullable: true,
    })
    relatedEntityId?: string;

    @Column({
        name: 'is_read',
        default: false,
    })
    isRead?: boolean;

    @CreateDateColumn({
        name: 'created_at',
    })
    createdAt?: Date;
}
