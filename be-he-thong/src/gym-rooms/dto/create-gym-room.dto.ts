import { IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateGymRoomDto {
  @IsString()
  @MaxLength(150)
  name!: string;

  @IsString()
  @MaxLength(60)
  roomType!: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsInt()
  managerStaffId?: number;

  @IsString()
  address!: string;

  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: string;
}
