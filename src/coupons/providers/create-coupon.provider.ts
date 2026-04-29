import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCouponDto } from '../dtos/create-coupon.dto';
import { Repository } from 'typeorm';
import { Coupon } from '../coupon.entity';
import { InjectRepository } from '@nestjs/typeorm';
@Injectable()
export class CreateCouponProvider {
  constructor(
    /**
     * Inject couponRepository
     */
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
  ) {}
  async createCoupon(createCouponDto: CreateCouponDto) {
    // 🔤 normalize code
    const code = createCouponDto.code.toUpperCase();

    // ❌ duplicate check
    const existing = await this.couponRepository.findOne({
      where: { code },
    });

    if (existing) {
      throw new BadRequestException('Coupon already exists');
    }

    const coupon = this.couponRepository.create({
      code,
    });

    return this.couponRepository.save(coupon);
  }
}
