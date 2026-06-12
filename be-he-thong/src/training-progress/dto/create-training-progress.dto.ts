import {
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';

export class CreateTrainingProgressDto {
    @IsOptional()
    @IsInt()
    trainingScheduleId?: number;

    @IsInt()
    memberId!: number;

    @IsOptional()
    @IsString()
    goal?: string;

    @IsOptional()
    @IsString()
    recordedAt?: string;

    @IsOptional()
    @IsString()
    date?: string;

    @IsOptional()
    @IsNumber()
    bodyWeight?: number;

    @IsOptional()
    @IsNumber()
    bodyFatPercent?: number;

    @IsOptional()
    @IsNumber()
    muscleMass?: number;

    @IsOptional()
    @IsString()
    evaluation?: string;
}
