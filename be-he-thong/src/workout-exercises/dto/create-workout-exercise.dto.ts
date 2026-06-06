import {
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';

export class CreateWorkoutExerciseDto {
    @IsInt()
    @Min(1)
    sessionId!: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    exerciseId?: number;

    @IsInt()
    @Min(1)
    sets?: number;

    @IsInt()
    @Min(1)
    reps?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    weight?: number;

    @IsOptional()
    @IsString()
    note?: string;
}