import {
  IsArray,
  ValidateNested,
  IsOptional,
  IsString,
  IsNumber,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from './create-order-item.dto';
import { BillingAddressDto } from './billing-address.dto';

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @ValidateNested()
  @Type(() => BillingAddressDto)
  billingAddress!: BillingAddressDto;

  @IsNumber()
  @IsNotEmpty()
  subTotal!: number;

  @IsNumber()
  @IsNotEmpty()
  discount!: number;

  @IsNumber()
  @IsNotEmpty()
  tax!: number;

  @IsNumber()
  @IsNotEmpty()
  totalAmount!: number;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string; // "RAZORPAY", "STRIPE"
}
