import {
    IsInt,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';

export class CreateWorkoutSessionDto {
    @IsInt()
    @Min(1)
    memberId!: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    trainerId?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    trainingScheduleId?: number;

    @IsOptional()
    @IsString()
    notes?: string;
}