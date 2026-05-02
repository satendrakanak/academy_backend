import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import Razorpay from 'razorpay';
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
import { CouponsService } from 'src/coupons/providers/coupons.service';
import { MediaFileMappingService } from 'src/common/media-file-mapping/providers/media-file-mapping.service';
import { UpdateOrderStatusByAdminProvider } from './update-order-status-by-admin.provider';
import { FailedPaymentDetails } from '../interfaces/failed-payment-details.interface';

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

    /**
     * Inject couponsService
     */
    private readonly couponsService: CouponsService,

    /**
     * Inject mediaFileMappingService
     */

    private readonly mediaFileMappingService: MediaFileMappingService,

    /**
     * Inject updateOrderStatusByAdminProvider
     */
    private readonly updateOrderStatusByAdminProvider: UpdateOrderStatusByAdminProvider,
  ) {}

  async findAll(): Promise<Order[]> {
    return await this.orderRepository.find({
      relations: [
        'items',
        'items.course',
        'items.course.image',
        'user',
        'refundRequests',
        'refundRequests.requester',
        'refundRequests.reviewedBy',
        'refundRequests.logs',
        'refundRequests.logs.actor',
      ],
      order: {
        createdAt: 'DESC',
        refundRequests: {
          createdAt: 'DESC',
          logs: {
            createdAt: 'ASC',
          },
        },
      },
    });
  }

  async findOneById(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: [
        'items',
        'items.course',
        'items.course.image',
        'user',
        'refundRequests',
        'refundRequests.requester',
        'refundRequests.reviewedBy',
        'refundRequests.logs',
        'refundRequests.logs.actor',
      ],
      order: {
        refundRequests: {
          createdAt: 'DESC',
          logs: {
            createdAt: 'ASC',
          },
        },
      },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const mappedOrder = await this.mediaFileMappingService.mapOrder(order);

    return mappedOrder;
  }

  async create(createOrderDto: CreateOrderDto, user: ActiveUserData) {
    return await this.createOrderProvider.create(createOrderDto, user);
  }

  async verifyPayment(verifyPaymentDto: VerifyPaymentDto) {
    const { keyId, keySecret } = await this.settingsService.getActiveGateway(
      PaymentProvider.RAZORPAY,
    );

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

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

    const payment = await razorpay.payments.fetch(
      verifyPaymentDto.razorpay_payment_id,
    );

    const order = await this.orderRepository.findOne({
      where: {
        orderId: verifyPaymentDto.razorpay_order_id,
      },
      relations: ['items', 'items.course', 'user'],
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
      {
        method: payment.method,
        bank: payment.bank,
        wallet: payment.wallet,
        vpa: payment.vpa,
        cardId: payment.card_id,
      },
    );

    // 🔥 7. Mark coupon used

    await this.couponsService.applyCouponUsage(order);

    return { success: true, message: 'Payment verified' };
  }

  async retryPayment(orderId: number) {
    return await this.retryPaymentProvider.retryPayment(orderId);
  }

  async cancelPendingOrder(id: number, user: ActiveUserData) {
    const order = await this.orderRepository.findOne({
      where: { id, user: { id: user.sub } },
      relations: ['items', 'items.course', 'user'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.updateOrderStatusByAdminProvider.updateStatus(
      order.id,
      OrderStatus.CANCELLED,
    );
  }

  async markPaymentFailed(
    id: number,
    user: ActiveUserData,
    paymentId?: string | null,
  ) {
    const order = await this.orderRepository.findOne({
      where: { id, user: { id: user.sub } },
      relations: ['items', 'items.course', 'user'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === OrderStatus.PAID) {
      throw new BadRequestException('Paid order cannot be marked as failed');
    }

    let paymentDetails: FailedPaymentDetails | undefined;
    let finalPaymentId = paymentId || order.paymentId || null;

    if (finalPaymentId) {
      const { keyId, keySecret } = await this.settingsService.getActiveGateway(
        PaymentProvider.RAZORPAY,
      );

      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

      const payment = await razorpay.payments.fetch(finalPaymentId);

      paymentDetails = {
        method: payment.method || null,
        bank: payment.bank || null,
        wallet: payment.wallet || null,
        vpa: payment.vpa || null,
        cardId: payment.card_id || null,
        errorCode: payment.error_code || null,
        errorDescription: payment.error_description || null,
      };
    }

    order.paymentId = finalPaymentId;

    await this.orderRepository.save(order);

    return this.changeOrderStatusProvider.markAsFailed(
      order.id,
      order.orderId!,
      order.paymentId || 'FAILED',
      paymentDetails,
    );
  }

  async findUserOrders(userId: number) {
    const orders = await this.orderRepository.find({
      where: { user: { id: userId } },
      relations: [
        'items',
        'items.course',
        'items.course.image',
        'user',
        'refundRequests',
        'refundRequests.requester',
        'refundRequests.reviewedBy',
        'refundRequests.logs',
        'refundRequests.logs.actor',
      ],
      order: { createdAt: 'DESC' },
    });

    return Promise.all(
      orders.map((order) => this.mediaFileMappingService.mapOrder(order)),
    );
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    return await this.handleWebhookProvider.handleWebhook(rawBody, signature);
  }

  async updateStatus(id: number, status: OrderStatus) {
    return await this.updateOrderStatusByAdminProvider.updateStatus(id, status);
  }
}
