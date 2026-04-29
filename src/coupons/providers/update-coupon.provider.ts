import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Coupon } from '../coupon.entity';
import { Repository } from 'typeorm';
import { PatchCouponDto } from '../dtos/patch-coupon.dto';
import { CouponType } from '../enums/couponType.enum';
import { CouponScope } from '../enums/couponScope.enum';

@Injectable()
export class UpdateCouponProvider {
  constructor(
    /**
     * Inject couponRepository
     */
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
  ) {}

  async updateCoupon(
    id: number,
    patchCouponDto: PatchCouponDto,
  ): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({
      where: { id },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    // 🔤 CODE
    if (patchCouponDto.code) {
      const code = patchCouponDto.code.toUpperCase();

      const existing = await this.couponRepository.findOne({
        where: { code },
      });

      if (existing && existing.id !== id) {
        throw new BadRequestException('Coupon code already exists');
      }

      coupon.code = code;
    }

    // 🎯 TYPE
    if (patchCouponDto.type) {
      coupon.type = patchCouponDto.type;
    }

    //status
    if (patchCouponDto.status) {
      coupon.status = patchCouponDto.status;
    }

    // 💰 VALUE
    if (patchCouponDto.value !== undefined) {
      if (patchCouponDto.value < 0) {
        throw new BadRequestException('Value cannot be negative');
      }
      coupon.value = patchCouponDto.value;
    }

    // 🧢 MAX DISCOUNT
    if (patchCouponDto.maxDiscount !== undefined) {
      coupon.maxDiscount = patchCouponDto.maxDiscount;
    }

    // 🧾 MIN ORDER
    if (patchCouponDto.minOrderValue !== undefined) {
      coupon.minOrderValue = patchCouponDto.minOrderValue;
    }

    // ⚡ AUTO APPLY
    if (patchCouponDto.isAutoApply !== undefined) {
      coupon.isAutoApply = patchCouponDto.isAutoApply;
    }

    // 📊 USAGE
    if (patchCouponDto.usageLimit !== undefined) {
      coupon.usageLimit = patchCouponDto.usageLimit;
    }

    if (patchCouponDto.perUserLimit !== undefined) {
      coupon.perUserLimit = patchCouponDto.perUserLimit;
    }

    // 📅 VALIDITY
    if (patchCouponDto.validFrom !== undefined) {
      coupon.validFrom = patchCouponDto.validFrom
        ? new Date(patchCouponDto.validFrom)
        : null;
    }

    if (patchCouponDto.validTill !== undefined) {
      coupon.validTill = patchCouponDto.validTill
        ? new Date(patchCouponDto.validTill)
        : null;
    }

    // ❗ DATE VALIDATION
    if (coupon.validFrom && coupon.validTill) {
      if (coupon.validFrom >= coupon.validTill) {
        throw new BadRequestException('Invalid date range');
      }
    }

    // ❗ PERCENTAGE VALIDATION
    if (
      coupon.type === CouponType.PERCENTAGE &&
      coupon.value !== undefined &&
      coupon.value > 100
    ) {
      throw new BadRequestException('Percentage cannot exceed 100');
    }

    // ============================
    // 🔥 SCOPE + COURSE SYNC (FINAL)
    // ============================

    // 👉 CASE 1: courses explicitly sent
    if ('applicableCourseIds' in patchCouponDto) {
      const ids = patchCouponDto.applicableCourseIds;

      coupon.applicableCourseIds = ids;

      if (ids === null) {
        coupon.scope = CouponScope.GLOBAL;
      } else if (Array.isArray(ids) && ids.length > 0) {
        coupon.scope = CouponScope.COURSE;
      }
    }

    // 👉 CASE 2: scope explicitly sent
    if (patchCouponDto.scope) {
      coupon.scope = patchCouponDto.scope;

      if (patchCouponDto.scope === CouponScope.GLOBAL) {
        coupon.applicableCourseIds = null;
      }
    }

    // ❗ FINAL VALIDATION (IMPORTANT)
    if (
      coupon.scope === CouponScope.COURSE &&
      (!coupon.applicableCourseIds || coupon.applicableCourseIds.length === 0)
    ) {
      throw new BadRequestException(
        'Course IDs required for COURSE scope coupon',
      );
    }

    return await this.couponRepository.save(coupon);
  }
}
