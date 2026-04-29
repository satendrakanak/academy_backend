import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SettingsService } from 'src/settings/providers/settings.service';
import { PaymentProvider } from 'src/settings/enums/payment-provider.enum';
import * as crypto from 'crypto';
import { OrderStatus } from '../enums/orderStatus.enum';
import { Repository } from 'typeorm';
import { Order } from '../order.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ChangeOrderStatusProvider } from './change-order-status.provider';

@Injectable()
export class HandleWebhookProvider {
  constructor(
    /**
     * Inject ordersRepository
     */

    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    private readonly settingsService: SettingsService,

    /**
     * Inject changeOrderStatusProvider
     */
    private readonly changeOrderStatusProvider: ChangeOrderStatusProvider,
  ) {}
  async handleWebhook(rawBody: Buffer, signature: string) {
    const { webhookSecret } = await this.settingsService.getActiveGateway(
      PaymentProvider.RAZORPAY,
    );

    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret missing');
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const body = JSON.parse(rawBody.toString());
    const event = body.event;

    const payment = body.payload?.payment?.entity;
    if (!payment) return { status: 'ignored' };

    const razorpayOrderId = payment.order_id;
    const paymentId = payment.id;

    const order = await this.orderRepository.findOne({
      where: { paymentId: razorpayOrderId },
      relations: ['items', 'items.course', 'user'],
    });

    if (!order) return { status: 'ignored' };

    if (
      order.status === OrderStatus.PAID ||
      order.status === OrderStatus.FAILED
    ) {
      return { status: 'already_processed' };
    }

    switch (event) {
      case 'payment.captured':
        await this.changeOrderStatusProvider.markAsPaid(
          order.id,
          razorpayOrderId,
          paymentId,
        );
        break;

      case 'payment.failed':
        await this.changeOrderStatusProvider.markAsFailed(
          order.id,
          razorpayOrderId,
          paymentId,
        );
        break;

      default:
        return { status: 'ignored_event' };
    }

    return { status: 'processed' };
  }
}
