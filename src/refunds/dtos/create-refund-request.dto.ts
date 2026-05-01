import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRefundRequestDto {
  @IsString()
  @MaxLength(1200)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  customerNote?: string;
}
