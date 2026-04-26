import {
  IsEnum,
  IsBoolean,
  IsString,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { PaymentProvider } from '../enums/payment-provider.enum';
import { PaymentMode } from '../enums/payment-mode.enum';

export class UpsertPaymentGatewayDto {
  @IsEnum(PaymentProvider)
  provider!: PaymentProvider;

  @IsEnum(PaymentMode)
  mode!: PaymentMode;

  @IsString()
  @IsNotEmpty()
  keyId!: string;

  @IsString()
  @IsNotEmpty()
  keySecret!: string;

  @IsString()
  @IsOptional()
  webhookSecret?: string;

  @IsString()
  @IsOptional()
  webhookUrl?: string;

  @IsBoolean()
  isActive!: boolean;
}
