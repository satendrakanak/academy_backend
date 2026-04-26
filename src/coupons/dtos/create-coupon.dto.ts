import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  IsDateString,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { CouponType } from '../enums/couponType.enum';
import { CouponScope } from '../enums/couponScope.enum';
import { CouponStatus } from '../enums/couponStatus.enum';

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsEnum(CouponType)
  @IsOptional()
  type?: CouponType;

  @IsEnum(CouponStatus)
  @IsOptional()
  status?: CouponStatus;

  @IsNumber()
  @Min(0)
  @IsOptional()
  value?: number;

  @IsOptional()
  @IsNumber()
  maxDiscount?: number;

  @IsOptional()
  @IsNumber()
  minOrderValue?: number;

  @IsEnum(CouponScope)
  @IsOptional()
  scope?: CouponScope;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  applicableCourseIds?: number[];

  @IsOptional()
  @IsBoolean()
  isAutoApply?: boolean;

  @IsOptional()
  @IsNumber()
  usageLimit?: number;

  @IsOptional()
  @IsNumber()
  perUserLimit?: number;

  @IsDateString()
  @IsOptional()
  validFrom?: string;

  @IsDateString()
  @IsOptional()
  validTill?: string;
}
