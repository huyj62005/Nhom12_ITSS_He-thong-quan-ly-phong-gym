import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateTrainerProfileDto {
  @IsInt()
  userId!: number;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @Min(0)
  experienceYears?: number;

  @IsOptional()
  @Min(0)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  specialties?: string;

  status?: string;
}
