import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Coupon } from '../coupon.entity';
import { Repository } from 'typeorm';
import { CouponUsage } from '../coupon-usage.entity';
import { CouponStatus } from '../enums/couponStatus.enum';
import { ApplyCouponProvider } from './apply-coupon.provider';

@Injectable()
export class AutoApplyCouponProvider {
  constructor(
    /**
     * Inject couponRepository
     */
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,

    /**
     * Inject couponUsageRepository
     */
    @InjectRepository(CouponUsage)
    private couponUsageRepository: Repository<CouponUsage>,

    /**
     * Inject applyCouponProvider
     */

    private readonly applyCouponProvider: ApplyCouponProvider,
  ) {}
  async autoApplyCoupon(
    userId: number,
    cartTotal: number,
    courseIds: number[],
  ) {
    const coupons = await this.couponRepository.find({
      where: {
        isAutoApply: true,
        status: CouponStatus.ACTIVE,
      },
    });

    let best: Coupon | null = null;
    let maxDiscount = 0;

    for (const coupon of coupons) {
      try {
        await this.applyCouponProvider.validateCoupon(
          coupon,
          userId,
          cartTotal,
          courseIds,
        );

        const discount = this.applyCouponProvider.calculateDiscount(
          coupon,
          cartTotal,
        );

        if (discount > maxDiscount) {
          maxDiscount = discount;
          best = coupon;
        }
      } catch (e) {
        // ignore invalid coupon
      }
    }

    if (!best) return null;

    return {
      couponId: best.id,
      code: best.code,
      discount: maxDiscount,
      finalAmount: cartTotal - maxDiscount,
    };
  }
}
