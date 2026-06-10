import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  CARD = 'card',
  MOMO = 'momo',
  OTHER = 'other',
}

export class CreatePaymentDto {
  @IsInt()
  memberId!: number;

  @IsOptional()
  @IsInt()
  memberPackageId?: number;

  @IsNumber()
  @Min(0)
  amount?: number;

  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsString()
  status?: string;
}
