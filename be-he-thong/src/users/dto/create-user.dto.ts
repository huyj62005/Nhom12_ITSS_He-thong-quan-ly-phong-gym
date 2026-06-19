import {
    IsEmail,
    IsEnum,
    IsOptional,
    IsString,
    Length,
} from 'class-validator';

export enum UserRole {
    OWNER = 'owner',
    MANAGER = 'manager',
    TRAINER = 'trainer',
    MEMBER = 'member',
}

export class CreateUserDto {
    @IsString()
    @Length(2, 150)
    fullName!: string;

    @IsEmail()
    email!: string;

    @IsString()
    @Length(6, 255)
    password!: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsEnum(UserRole)
    role!: UserRole;
}
