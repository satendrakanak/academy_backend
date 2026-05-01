import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ActiveUser } from 'src/auth/decorators/active-user.decorator';
import type { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { CreateRefundRequestDto } from './dtos/create-refund-request.dto';
import {
  ReviewRefundRequestDto,
} from './dtos/review-refund-request.dto';
import { RefundsService } from './providers/refunds.service';

@Controller('refund-requests')
export class RefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  @Get('my')
  async findMine(@ActiveUser() user: ActiveUserData) {
    return this.refundsService.findMine(user.sub);
  }

  @Get('admin')
  async findAllAdmin() {
    return this.refundsService.findAllAdmin();
  }

  @Get(':id')
  async findOneById(@Param('id', ParseIntPipe) id: number) {
    return this.refundsService.findOneById(id);
  }

  @Post('orders/:orderId')
  async createRequest(
    @Param('orderId', ParseIntPipe) orderId: number,
    @ActiveUser() user: ActiveUserData,
    @Body() dto: CreateRefundRequestDto,
  ) {
    return this.refundsService.createRequest(orderId, user, dto);
  }

  @Patch(':id/review')
  async reviewRequest(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserData,
    @Body() dto: ReviewRefundRequestDto,
  ) {
    return this.refundsService.reviewRequest(id, user, dto);
  }

  @Post(':id/sync')
  async syncRefundStatus(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.refundsService.syncRefundStatus(id, user);
  }
}
