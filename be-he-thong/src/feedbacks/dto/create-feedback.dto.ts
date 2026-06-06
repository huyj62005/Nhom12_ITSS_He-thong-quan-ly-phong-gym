import {
    IsInt,
    IsOptional,
    IsString,
} from 'class-validator';

export class CreateFeedbackDto {
    @IsInt()
    memberId!: number;

    @IsOptional()
    @IsString()
    title?: string;

    @IsString()
    content?: string;

    @IsOptional()
    @IsString()
    category?: string;
}