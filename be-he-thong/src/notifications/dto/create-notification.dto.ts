import {
    IsInt,
    IsOptional,
    IsString,
} from 'class-validator';

export class CreateNotificationDto {
    @IsInt()
    userId!: number;

    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    content?: string;
}