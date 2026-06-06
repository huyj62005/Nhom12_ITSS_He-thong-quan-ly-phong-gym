import {
    IsEnum,
    IsNumber,
    IsString,
    Min,
} from 'class-validator';

export enum PackageType {
    MONTH = 'month',
    QUARTER = 'quarter',
    YEAR = 'year',
    PT = 'pt',
}

export class CreateGymPackageDto {
    @IsString()
    name?: string;

    @IsEnum(PackageType)
    type?: PackageType;

    @IsNumber()
    @Min(0)
    price?: number;

    @Min(1)
    durationDays?: number;

    @IsString()
    description?: string;

    @IsString()
    benefits?: string;
}