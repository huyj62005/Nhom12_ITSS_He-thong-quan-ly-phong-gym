import {
    IsInt,
    IsOptional,
    IsString,
} from 'class-validator';

export class CreateNotificationDto {
    @IsInt()
    userId!: number;

    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsString()
    message?: string;

    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsString()
    targetRoute?: string;

    @IsOptional()
    @IsString()
    target_route?: string;

    @IsOptional()
    @IsString()
    relatedEntityId?: string;

    @IsOptional()
    @IsString()
    related_entity_id?: string;
}
