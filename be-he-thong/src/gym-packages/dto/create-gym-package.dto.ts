import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';

export enum PackageType {
    MONTHLY = 'monthly',
    QUARTERLY = 'quarterly',
    YEARLY = 'yearly',
    VIP = 'vip',
    PT = 'pt',
}

export class CreateGymPackageDto {
    @IsString()
    name!: string;

    @IsOptional()
    @IsEnum(PackageType)
    type?: PackageType;

    @IsNumber()
    @Min(0)
    price!: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    durationDays?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    duration?: number;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    benefits?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    features?: string[];

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
