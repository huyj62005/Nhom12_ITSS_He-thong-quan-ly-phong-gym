import {
    IsOptional,
    IsString,
    Length,
} from 'class-validator';

export class CreateExerciseDto {
    @IsString()
    @Length(1, 150)
    name!: string;

    @IsOptional()
    @IsString()
    @Length(1, 100)
    muscleGroup?: string;

    @IsOptional()
    @IsString()
    description?: string;
}