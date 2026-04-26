import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CouponsService } from './providers/coupons.service';
import { CreateCouponDto } from './dtos/create-coupon.dto';
import { GetCouponsDto } from 'src/coupons/dtos/get-coupons.dto';
import { Coupon } from './coupon.entity';
import { Paginated } from 'src/common/pagination/interfaces/paginated.interface';
import { PatchCouponDto } from './dtos/patch-coupon.dto';
import { DeleteRecord } from 'src/common/interfaces/delete-record.interface';

@Controller('coupons')
export class CouponsController {
  constructor(
    /**
     * Inject couponsService
     */
    private readonly couponsService: CouponsService,
  ) {}

  @Get()
  findAll(@Query() getCouponsDto: GetCouponsDto): Promise<Paginated<Coupon>> {
    return this.couponsService.findAll(getCouponsDto);
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number): Promise<Coupon> {
    return await this.couponsService.findById(id);
  }

  @Post()
  async create(@Body() createCouponDto: CreateCouponDto): Promise<Coupon> {
    return await this.couponsService.create(createCouponDto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() patchCouponDto: PatchCouponDto,
  ): Promise<Coupon> {
    return await this.couponsService.update(id, patchCouponDto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<DeleteRecord> {
    return await this.couponsService.delete(id);
  }
}
