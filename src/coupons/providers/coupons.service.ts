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
import { ApplyCouponProvider } from './apply-coupon.provider';
import { AutoApplyCouponProvider } from './auto-apply-coupon.provider';
import { AutoApplyBulkCouponProvider } from './auto-apply-bulk-coupon.provider';

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

    /**
     * Inject applyCouponProvider
     */

    private readonly applyCouponProvider: ApplyCouponProvider,

    /**
     * Inject autoApplyCouponProvider
     */
    private readonly autoApplyCouponProvider: AutoApplyCouponProvider,

    /**
     * Inject autoApplyBulkCouponProvider
     */

    private readonly autoApplyBulkCouponProvider: AutoApplyBulkCouponProvider,
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

  async findByCode(code: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({
      where: { code },
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

  async applyCoupon(
    userId: number,
    code: string,
    cartTotal: number,
    courseIds: number[],
  ) {
    return await this.applyCouponProvider.apply(
      userId,
      code,
      cartTotal,
      courseIds,
    );
  }

  async autoApplyCoupon(
    userId: number,
    cartTotal: number,
    courseIds: number[],
  ) {
    return await this.autoApplyCouponProvider.autoApplyCoupon(
      userId,
      cartTotal,
      courseIds,
    );
  }

  async autoApplyBulk(
    userId: number,
    courses: { id: number; price: number }[],
  ) {
    return await this.autoApplyBulkCouponProvider.autoApplyBulk(
      userId,
      courses,
    );
  }

  async validateCoupon(
    coupon: Coupon,
    userId: number,
    cartTotal: number,
    courseIds: number[],
  ) {
    return await this.applyCouponProvider.validateCoupon(
      coupon,
      userId,
      cartTotal,
      courseIds,
    );
  }

  calculateDiscount(coupon: Coupon, total: number): number {
    return this.applyCouponProvider.calculateDiscount(coupon, total);
  }

  async applyStackedCoupons(
    userId: number,
    cartTotal: number,
    courseIds: number[],
    manualCode?: string,
  ) {
    return await this.applyCouponProvider.applyStackedCoupons(
      userId,
      cartTotal,
      courseIds,
      manualCode,
    );
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
