import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Order } from '../order.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentsService } from 'src/payments/providers/payments.service';
import { OrderStatus } from '../enums/orderStatus.enum';

@Injectable()
export class RetryPaymentProvider {
  constructor(
    /**
     * Inject orderRepository
     */
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    /**
     * Inject paymentsService
     * */

    private readonly paymentsService: PaymentsService,
  ) {}
  async retryPayment(orderId: number) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.course', 'user'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // ❌ already paid → retry allowed nahi
    if (order.status === OrderStatus.PAID) {
      throw new BadRequestException('Order already paid');
    }

    // 🔥 retry count increase
    order.paymentAttempts += 1;

    // 🔥 new razorpay order create
    const razorpayOrder = await this.paymentsService.createOrder(
      order.totalAmount,
      `order_${order.id}_retry_${order.paymentAttempts}`,
    );

    // 🔥 update mapping
    order.orderId = razorpayOrder.id;
    order.status = OrderStatus.PENDING;

    await this.orderRepository.save(order);

    return {
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      courses: order.items.map((item) => ({
        id: item.course.id,
        slug: item.course.slug,
        title: item.course.title,
      })),
    };
  }
}
