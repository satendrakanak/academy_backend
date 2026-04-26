import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { OrdersService } from './providers/orders.service';
import { CreateOrderDto } from './dtos/create-order.dto';
import { ActiveUser } from 'src/auth/decorators/active-user.decorator';
import type { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { VerifyPaymentDto } from './dtos/verify-payment.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import type { Request } from 'express';

@Controller('orders')
export class OrdersController {
  constructor(
    /**
     * Inject ordersService
     */

    private readonly ordersService: OrdersService,
  ) {}

  // 🔥 Create Order
  @Post()
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @ActiveUser() user: ActiveUserData,
  ) {
    return await this.ordersService.create(createOrderDto, user);
  }

  // 🔥 Get My Orders
  @Get('my-orders')
  async getMyOrders(@ActiveUser() user: ActiveUserData) {
    return await this.ordersService.findUserOrders(user.sub);
  }

  @Post('verify')
  async verify(@Body() verifyPaymentDto: VerifyPaymentDto) {
    return await this.ordersService.verifyPayment(verifyPaymentDto);
  }

  @Post(':id/retry')
  async retryPayment(@Param('id') orderId: number) {
    return this.ordersService.retryPayment(orderId);
  }

  @Auth(AuthType.None)
  @Post('webhook')
  async handleWebhook(@Req() req: Request) {
    const signature = req.headers['x-razorpay-signature'] as string;
    if (!signature) {
      throw new BadRequestException('Missing signature');
    }

    return await this.ordersService.handleWebhook(req.body, signature);
  }
}
