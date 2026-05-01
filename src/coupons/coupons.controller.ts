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
import { ApplyCouponDto } from './dtos/apply-coupon.dto';
import { ActiveUser } from 'src/auth/decorators/active-user.decorator';
import type { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { AutoApplyCouponDto } from './dtos/auto-apply-coupon.dto';
import { AutoApplyBulkCouponDto } from './dtos/auto-apply-bulk.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';

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

  @Auth(AuthType.Optional)
  @Post('apply')
  async applyCoupon(
    @Body() applyCouponDto: ApplyCouponDto,
    @ActiveUser() user: ActiveUserData,
  ) {
    const userId = user?.sub;

    return this.couponsService.applyCoupon(
      userId,
      applyCouponDto.code,
      applyCouponDto.cartTotal,
      applyCouponDto.courseIds,
    );
  }

  @Auth(AuthType.Optional)
  @Post('auto-apply')
  async autoApply(
    @Body() autoApplyCouponDto: AutoApplyCouponDto,
    @ActiveUser() user: ActiveUserData,
  ) {
    const userId = user?.sub;

    return this.couponsService.autoApplyCoupon(
      userId,
      autoApplyCouponDto.cartTotal,
      autoApplyCouponDto.courseIds,
    );
  }
  @Auth(AuthType.Optional)
  @Post('auto-apply-bulk')
  async autoApplyBulk(
    @Body() autoApplyBulkCouponDto: AutoApplyBulkCouponDto,
    @ActiveUser() user: ActiveUserData,
  ) {
    const userId = user?.sub;

    const data = await this.couponsService.autoApplyBulk(
      userId,
      autoApplyBulkCouponDto.courses,
    );

    return {
      success: true,
      data,
    };
  }
}
