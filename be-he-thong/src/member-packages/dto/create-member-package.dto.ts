import {
    IsDateString,
    IsInt,
    IsOptional,
    IsString,
} from 'class-validator';

export class CreateMemberPackageDto {
    @IsInt()
    memberId!: number;

    @IsInt()
    packageId!: number;

    @IsOptional()
    @IsInt()
    trainerId?: number;

    @IsOptional()
    @IsDateString()
    startDate?: Date;

    @IsOptional()
    @IsDateString()
    endDate?: Date;

    @IsOptional()
    @IsString()
    status?: string;
}
