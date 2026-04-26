import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Coupon } from '../coupon.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CouponUsage } from '../coupon-usage.entity';
import { CouponStatus } from '../enums/couponStatus.enum';
import { CouponScope } from '../enums/couponScope.enum';
import { CouponType } from '../enums/couponType.enum';
import { Order } from 'src/orders/order.entity';
import { CreateCouponProvider } from './create-coupon.provider';
import { CreateCouponDto } from '../dtos/create-coupon.dto';
import { FindAllCouponsProvider } from './find-all-coupons.provider';
import { GetCouponsDto } from 'src/coupons/dtos/get-coupons.dto';
import { PatchCouponDto } from '../dtos/patch-coupon.dto';
import { UpdateCouponProvider } from './update-coupon.provider';

@Injectable()
export class CouponsService {
  constructor(
    /**
     * Inject couponRepository
     */
    @InjectRepository(Coupon)
    private couponRepository: Repository<Coupon>,

    /**
     * Inject couponUsageRepository
     */
    @InjectRepository(CouponUsage)
    private couponUsageRepository: Repository<CouponUsage>,

    /**
     * Inject createCouponProvider
     */

    private readonly createCouponProvider: CreateCouponProvider,

    /**
     * Inject updateCouponProvider
     */

    private readonly updateCouponProvider: UpdateCouponProvider,

    /**
     * Inject findAllCouponsProvider
     */
    private readonly findAllCouponsProvider: FindAllCouponsProvider,
  ) {}

  async findAll(getCouponsDto: GetCouponsDto) {
    return await this.findAllCouponsProvider.findAllCoupons(getCouponsDto);
  }

  async findById(id: number): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({
      where: { id },
    });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return coupon;
  }

  async create(createCouponDto: CreateCouponDto) {
    return this.createCouponProvider.createCoupon(createCouponDto);
  }

  async update(id: number, patchCouponDto: PatchCouponDto) {
    return await this.updateCouponProvider.updateCoupon(id, patchCouponDto);
  }

  async delete(id: number) {
    const result = await this.couponRepository.delete(id);

    if (!result.affected) {
      throw new NotFoundException('Coupon not found');
    }
    return {
      message: 'Coupon deleted successfully',
    };
  }

  async apply(
    userId: number,
    code: string,
    cartTotal: number,
    courseIds: number[],
  ) {
    // 🔤 normalize
    code = code.toUpperCase();

    const coupon = await this.couponRepository.findOne({
      where: { code },
    });

    if (!coupon) {
      throw new BadRequestException('Invalid coupon code');
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

  private async validateCoupon(
    coupon: Coupon,
    userId: number,
    cartTotal: number,
    courseIds: number[],
  ) {
    const now = new Date();

    // ❌ inactive
    if (coupon.status !== CouponStatus.ACTIVE) {
      throw new BadRequestException('Coupon is inactive');
    }

    // ❌ expired
    if (now < coupon.validFrom! || now > coupon.validTill!) {
      throw new BadRequestException('Coupon expired');
    }

    // ❌ usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    // ❌ per user limit
    const usedByUser = await this.couponUsageRepository.count({
      where: {
        user: { id: userId },
        coupon: { id: coupon.id },
      },
    });

    if (usedByUser >= coupon.perUserLimit) {
      throw new BadRequestException('Coupon already used');
    }

    // ❌ min order
    if (coupon.minOrderValue && cartTotal < Number(coupon.minOrderValue)) {
      throw new BadRequestException(
        `Minimum order value is ${coupon.minOrderValue}`,
      );
    }

    // ❌ course validation
    if (
      coupon.scope === CouponScope.COURSE &&
      coupon.applicableCourseIds?.length
    ) {
      const isValid = courseIds.some(
        (id) =>
          coupon.applicableCourseIds && coupon.applicableCourseIds.includes(id),
      );

      if (!isValid) {
        throw new BadRequestException(
          'Coupon not applicable on selected courses',
        );
      }
    }
  }

  private calculateDiscount(coupon: Coupon, total: number): number {
    let discount = 0;

    if (coupon.type === CouponType.PERCENTAGE) {
      discount = total * (Number(coupon.value) / 100);

      if (coupon.maxDiscount) {
        discount = Math.min(discount, Number(coupon.maxDiscount));
      }
    } else {
      discount = Number(coupon.value);
    }

    // safety
    return Math.min(discount, total);
  }

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
        await this.validateCoupon(coupon, userId, cartTotal, courseIds);

        const discount = this.calculateDiscount(coupon, cartTotal);

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

  async markCouponUsed(couponId: number, userId: number, order: Order) {
    const coupon = await this.couponRepository.findOne({
      where: { id: couponId },
    });

    if (!coupon) return;

    // usage entry
    const usage = this.couponUsageRepository.create({
      coupon,
      user: { id: userId } as any,
      order,
    });

    await this.couponUsageRepository.save(usage);

    // increment usage count
    coupon.usedCount += 1;
    await this.couponRepository.save(coupon);
  }
}
