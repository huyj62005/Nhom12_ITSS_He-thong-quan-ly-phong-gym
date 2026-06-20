import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum EquipmentStatus {
  AVAILABLE = 'available',
  MAINTENANCE = 'maintenance',
  BROKEN = 'broken',
}

export class CreateEquipmentDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  equipmentCode?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsInt()
  gymRoomId?: number;

  @IsOptional()
  @IsInt()
  facilityId?: number;

  @IsOptional()
  @IsString()
  position?: string;

  @IsDateString()
  purchaseDate!: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  purchasePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @IsOptional()
  @IsDateString()
  lastMaintenanceDate?: Date;

  @IsOptional()
  @IsDateString()
  lastMaintenance?: Date;

  @IsOptional()
  @IsDateString()
  nextMaintenanceDate?: Date;

  @IsOptional()
  @IsDateString()
  nextMaintenance?: Date;

  @IsOptional()
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus;
}
