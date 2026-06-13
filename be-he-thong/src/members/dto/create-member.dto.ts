import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateMemberDto {
  @IsInt()
  userId!: number;

  @IsOptional()
  @IsInt()
  managedBy!: number;

  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: Date;

  @IsOptional()
  @IsString()
  memberType?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
