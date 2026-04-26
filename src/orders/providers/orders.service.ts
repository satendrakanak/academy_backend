import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Order } from '../order.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateOrderDto } from '../dtos/create-order.dto';
import { OrderStatus } from '../enums/orderStatus.enum';
import { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { VerifyPaymentDto } from '../dtos/verify-payment.dto';
import { SettingsService } from 'src/settings/providers/settings.service';
import { PaymentProvider } from 'src/settings/enums/payment-provider.enum';
import * as crypto from 'crypto';
import { HandleWebhookProvider } from './handle-webhook.provider';
import { CreateOrderProvider } from './create-order.provider';
import { ChangeOrderStatusProvider } from './change-order-status.provider';
import { RetryPaymentProvider } from './retry-payment.provider';

@Injectable()
export class OrdersService {
  constructor(
    /**
     * Inject orderRepository
     * */
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    /**
     * Inject createOrderProvider
     */

    private readonly createOrderProvider: CreateOrderProvider,

    /**
     * Inject settingsService
     */

    private readonly settingsService: SettingsService,

    /**
     * Inject handleWebhookProvider
     */
    private readonly handleWebhookProvider: HandleWebhookProvider,

    /**
     * Inject changeOrderStatusProvider
     */

    private readonly changeOrderStatusProvider: ChangeOrderStatusProvider,

    /**
     * Inject retryPaymentProvider
     */

    private readonly retryPaymentProvider: RetryPaymentProvider,
  ) {}

  async create(createOrderDto: CreateOrderDto, user: ActiveUserData) {
    return await this.createOrderProvider.create(createOrderDto, user);
  }

  async verifyPayment(verifyPaymentDto: VerifyPaymentDto) {
    const { keySecret } = await this.settingsService.getActiveGateway(
      PaymentProvider.RAZORPAY,
    );

    const body =
      verifyPaymentDto.razorpay_order_id +
      '|' +
      verifyPaymentDto.razorpay_payment_id;

    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    if (expected !== verifyPaymentDto.razorpay_signature) {
      throw new BadRequestException('Invalid signature');
    }

    const order = await this.orderRepository.findOne({
      where: {
        orderId: verifyPaymentDto.razorpay_order_id,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === OrderStatus.PAID) {
      return { success: true, message: 'Already paid' };
    }

    // 🔥 6. Mark as paid
    await this.changeOrderStatusProvider.markAsPaid(
      order.id,
      verifyPaymentDto.razorpay_order_id,
      verifyPaymentDto.razorpay_payment_id,
    );

    return { success: true, message: 'Payment verified' };
  }

  async retryPayment(orderId: number) {
    return await this.retryPaymentProvider.retryPayment(orderId);
  }

  async findUserOrders(userId: number) {
    return this.orderRepository.find({
      where: { user: { id: userId } },
      relations: ['items', 'items.course'],
      order: { createdAt: 'DESC' },
    });
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    return await this.handleWebhookProvider.handleWebhook(rawBody, signature);
  }
}
