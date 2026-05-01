import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Coupon } from '../coupon.entity';
import { CouponStatus } from '../enums/couponStatus.enum';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CouponUsage } from '../coupon-usage.entity';
import { CouponType } from '../enums/couponType.enum';
import { CouponScope } from '../enums/couponScope.enum';

@Injectable()
export class ApplyCouponProvider {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,

    @InjectRepository(CouponUsage)
    private readonly couponUsageRepository: Repository<CouponUsage>,
  ) {}

  // ===============================
  // 🎯 APPLY COUPON
  // ===============================
  async apply(
    userId: number | undefined,
    code: string,
    cartTotal: number,
    courseIds: number[],
  ) {
    if (!code?.trim()) {
      throw new BadRequestException('Coupon code is required');
    }

    if (!cartTotal || cartTotal <= 0) {
      throw new BadRequestException('Invalid cart total');
    }

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      throw new BadRequestException('No courses selected');
    }

    const normalizedCode = code.trim().toUpperCase();

    const coupon = await this.couponRepository.findOne({
      where: { code: normalizedCode },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    await this.validateCoupon(coupon, userId, cartTotal, courseIds);

    const discount = this.calculateDiscount(coupon, cartTotal);

    return {
      couponId: coupon.id,
      code: coupon.code,
      discount,
      finalAmount: cartTotal - discount,
    };
  }

  // ===============================
  // 🧠 VALIDATION
  // ===============================
  async validateCoupon(
    coupon: Coupon,
    userId: number | undefined,
    cartTotal: number,
    courseIds: number[],
  ): Promise<Coupon> {
    const now = new Date();

    // ❌ status
    if (coupon.status !== CouponStatus.ACTIVE) {
      throw new BadRequestException('This coupon is not active');
    }

    // ❌ date check (safe)
    if (
      (coupon.validFrom && now < coupon.validFrom) ||
      (coupon.validTill && now > coupon.validTill)
    ) {
      throw new BadRequestException('This coupon has expired');
    }

    // ❌ global usage limit
    if (
      coupon.usageLimit !== null &&
      coupon.usageLimit !== undefined &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    // ❌ per-user usage
    if (coupon.perUserLimit && userId) {
      const usedByUser = await this.couponUsageRepository.count({
        where: {
          user: { id: userId },
          coupon: { id: coupon.id },
        },
      });

      if (usedByUser >= coupon.perUserLimit) {
        throw new BadRequestException('You have already used this coupon');
      }
    }

    // ❌ min order
    if (coupon.minOrderValue && cartTotal < Number(coupon.minOrderValue)) {
      throw new BadRequestException(
        `Minimum order value is ₹${coupon.minOrderValue}`,
      );
    }

    // ❌ scope validation
    if (coupon.scope === CouponScope.COURSE) {
      if (
        !coupon.applicableCourseIds ||
        coupon.applicableCourseIds.length === 0
      ) {
        throw new BadRequestException(
          'Coupon is misconfigured (no courses assigned)',
        );
      }

      const isValid = courseIds.some((id) =>
        coupon.applicableCourseIds!.includes(id),
      );

      if (!isValid) {
        throw new BadRequestException(
          'Coupon is not applicable to selected courses',
        );
      }
    }

    return coupon;
  }

  // ===============================
  // 💰 DISCOUNT CALCULATION
  // ===============================
  calculateDiscount(coupon: Coupon, total: number): number {
    let discount = 0;

    if (coupon.type === CouponType.PERCENTAGE) {
      if (coupon.value && coupon.value > 100) {
        throw new BadRequestException('Invalid coupon percentage value');
      }

      discount = total * (Number(coupon.value) / 100);

      if (coupon.maxDiscount) {
        discount = Math.min(discount, Number(coupon.maxDiscount));
      }
    } else {
      discount = Number(coupon.value);
    }

    // ❌ safety
    if (discount < 0) {
      throw new BadRequestException('Invalid discount value');
    }

    return Math.min(Math.round(discount), total);
  }

  async applyStackedCoupons(
    userId: number,
    cartTotal: number,
    courseIds: number[],
    manualCode?: string,
  ) {
    let autoDiscount = 0;
    let manualDiscount = 0;

    let autoCoupon: Coupon | null = null;
    let manualCoupon: Coupon | null = null;

    // ===============================
    // 🔥 AUTO APPLY
    // ===============================
    const autoCoupons = await this.couponRepository.find({
      where: {
        isAutoApply: true,
        status: CouponStatus.ACTIVE,
      },
    });

    for (const coupon of autoCoupons) {
      try {
        await this.validateCoupon(coupon, userId, cartTotal, courseIds);

        const discount = this.calculateDiscount(coupon, cartTotal);

        if (discount > autoDiscount) {
          autoDiscount = discount;
          autoCoupon = coupon;
        }
      } catch {
        // ignore invalid
      }
    }

    const afterAuto = cartTotal - autoDiscount;

    // ===============================
    // 🔥 MANUAL APPLY
    // ===============================
    if (manualCode) {
      const coupon = await this.couponRepository.findOne({
        where: { code: manualCode.toUpperCase() },
      });

      if (!coupon) {
        throw new NotFoundException('Coupon not found');
      }

      await this.validateCoupon(coupon, userId, afterAuto, courseIds);

      manualDiscount = this.calculateDiscount(coupon, afterAuto);
      manualCoupon = coupon;
    }

    const totalDiscount = autoDiscount + manualDiscount;
    const finalAmount = cartTotal - totalDiscount;

    return {
      autoCoupon,
      manualCoupon,
      autoDiscount,
      manualDiscount,
      totalDiscount,
      finalAmount,
    };
  }
}
