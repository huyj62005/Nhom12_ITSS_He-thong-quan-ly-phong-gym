import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateTrainingScheduleDto {
  @IsOptional()
  @IsInt()
  memberPackageId?: number;

  @IsInt()
  memberId!: number;

  @IsOptional()
  @IsInt()
  trainerId?: number;

  @IsString()
  type?: string;

  @IsDateString()
  startTime?: Date;

  @IsDateString()
  endTime?: Date;

  status?: string;
}
