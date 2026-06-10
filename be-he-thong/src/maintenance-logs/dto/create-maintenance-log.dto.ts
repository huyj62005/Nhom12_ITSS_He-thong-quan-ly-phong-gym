import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateMaintenanceLogDto {
  @IsInt()
  equipmentId!: number;

  @IsDateString()
  maintenanceDate?: Date;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  cost?: number;

  @IsString()
  status?: string;
}
