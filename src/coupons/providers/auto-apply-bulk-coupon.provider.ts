import { Injectable } from '@nestjs/common';
import { AutoApplyCouponProvider } from './auto-apply-coupon.provider';

@Injectable()
export class AutoApplyBulkCouponProvider {
  constructor(
    private readonly autoApplyCouponProvider: AutoApplyCouponProvider,
  ) {}

  async autoApplyBulk(
    userId: number | undefined,
    courses: { id: number; price: number }[],
  ) {
    const result: Record<
      number,
      {
        couponId: number;
        code: string;
        discount: number;
        finalAmount: number;
      } | null
    > = {};

    for (const course of courses) {
      try {
        const res = await this.autoApplyCouponProvider.autoApplyCoupon(
          userId,
          course.price,
          [course.id],
        );

        result[course.id] = res;
      } catch (e) {
        result[course.id] = null;
      }
    }

    return result;
  }
}
