import { Module } from '@nestjs/common';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './providers/coupons.service';
import { CreateCouponProvider } from './providers/create-coupon.provider';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponUsage } from './coupon-usage.entity';
import { Coupon } from './coupon.entity';
import { FindAllCouponsProvider } from './providers/find-all-coupons.provider';
import { PaginationModule } from 'src/common/pagination/pagination.module';
import { UpdateCouponProvider } from './providers/update-coupon.provider';
import { ApplyCouponProvider } from './providers/apply-coupon.provider';
import { AutoApplyCouponProvider } from './providers/auto-apply-coupon.provider';
import { AutoApplyBulkCouponProvider } from './providers/auto-apply-bulk-coupon.provider';

@Module({
  imports: [TypeOrmModule.forFeature([Coupon, CouponUsage]), PaginationModule],
  controllers: [CouponsController],
  providers: [
    CouponsService,
    CreateCouponProvider,
    FindAllCouponsProvider,
    UpdateCouponProvider,
    ApplyCouponProvider,
    AutoApplyCouponProvider,
    AutoApplyBulkCouponProvider,
  ],
  exports: [CouponsService],
})
export class CouponsModule {}
