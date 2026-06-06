import {
    IsDateString,
    IsInt,
    IsOptional,
} from 'class-validator';

export class CreateMemberPackageDto {
    @IsInt()
    memberId!: number;

    @IsInt()
    packageId!: number;

    @IsOptional()
    @IsInt()
    trainerId?: number;

    @IsDateString()
    startDate?: Date;

    @IsDateString()
    endDate?: Date;
}