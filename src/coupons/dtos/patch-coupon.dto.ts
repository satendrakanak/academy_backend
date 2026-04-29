import { PartialType } from '@nestjs/swagger';
import { CreateCouponDto } from './create-coupon.dto';

export class PatchCouponDto extends PartialType(CreateCouponDto) {}
