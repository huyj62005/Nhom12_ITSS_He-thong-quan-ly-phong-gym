import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MemberPackage } from '../../member-packages/entities/member-package.entity';

@Entity('members')
export class Member {
    @PrimaryGeneratedColumn()
    id!: number;

    @OneToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ManyToOne(() => User, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'managed_by' })
    manager?: User;

    @Column({ name: 'full_name' })
    fullName?: string;

    @Column({ nullable: true })
    phone?: string;

    @Column({
        name: 'date_of_birth',
        type: 'date',
        nullable: true,
    })
    dateOfBirth?: Date;

    @Column({
        name: 'member_type',
        nullable: true,
    })
    memberType?: string;

    @Column({
        name: 'join_date',
        type: 'date',
    })
    joinDate?: Date;

    @Column()
    status?: string;

    @OneToMany(
        () => MemberPackage,
        (memberPackage) => memberPackage.member,
    )
    memberPackages?: MemberPackage[];
}