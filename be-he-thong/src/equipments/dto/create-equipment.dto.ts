import {
    IsDateString,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';

export class CreateEquipmentDto {
    @IsString()
    name!: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsNumber()
    quantity?: number;

    @IsOptional()
    @IsString()
    position?: string;

    @IsOptional()
    @IsDateString()
    purchaseDate?: Date;

    @IsOptional()
    @IsNumber()
    purchasePrice?: number;
}