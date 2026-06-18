import {
    IsDateString,
    IsIn,
    IsInt,
    IsOptional,
    IsString,
} from 'class-validator';

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

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsIn(['requested', 'accepted', 'rejected', 'resubmitted', 'cancelled'])
    approvalAction?: 'requested' | 'accepted' | 'rejected' | 'resubmitted' | 'cancelled';

    @IsOptional()
    @IsString()
    approvalReason?: string;
}
