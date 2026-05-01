import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export enum RefundDecision {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class ReviewRefundRequestDto {
  @IsEnum(RefundDecision)
  decision!: RefundDecision;

  @IsOptional()
  @IsNumber()
  @Min(1)
  approvedAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminNote?: string;
}
