import { IntersectionType } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsString,
  IsBoolean,
  IsDate,
} from 'class-validator';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';
import { CouponStatus } from 'src/coupons/enums/couponStatus.enum';
import { CouponType } from 'src/coupons/enums/couponType.enum';

export class GetCouponsBaseDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(CouponStatus)
  status?: CouponStatus;

  @IsOptional()
  @IsEnum(CouponType)
  type?: CouponType;

  @IsOptional()
  @IsBoolean()
  isAutoApply?: boolean;

  // 📅 Date range filter (createdAt ke liye)
  @IsOptional()
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @IsDate()
  endDate?: Date;
}

export class GetCouponsDto extends IntersectionType(
  GetCouponsBaseDto,
  PaginationQueryDto,
) {}
