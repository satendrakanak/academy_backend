import { Injectable } from '@nestjs/common';
import { Coupon } from '../coupon.entity';
import { Between, ILike, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { GetCouponsDto } from 'src/coupons/dtos/get-coupons.dto';
import { PaginationProvider } from 'src/common/pagination/providers/pagination.provider';
import { Paginated } from 'src/common/pagination/interfaces/paginated.interface';

@Injectable()
export class FindAllCouponsProvider {
  constructor(
    /**
     * Inject couponRepository
     */
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,

    /**
     * Inject paginationProvider
     */
    private readonly paginationProvider: PaginationProvider,
  ) {}

  async findAllCoupons(
    getCouponsDto: GetCouponsDto,
  ): Promise<Paginated<Coupon>> {
    const result = await this.paginationProvider.paginateQuery(
      {
        limit: getCouponsDto.limit ?? 10,
        page: getCouponsDto.page ?? 1,
      },
      this.couponRepository,
      {
        order: {
          createdAt: 'DESC',
        },
      },
    );

    return result;
  }
}
