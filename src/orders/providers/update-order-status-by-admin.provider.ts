import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Order } from '../order.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderStatus } from '../enums/orderStatus.enum';
import { EnrollmentsService } from 'src/enrollments/providers/enrollments.service';
import { CouponsService } from 'src/coupons/providers/coupons.service';
import { OrderEmailProvider } from './email/order-email.provider';

@Injectable()
export class UpdateOrderStatusByAdminProvider {
  constructor(
    /**
     * Inject orderRepository
     * */
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    /**
     * Inject enrollmentsService
     */

    private readonly enrollmentsService: EnrollmentsService,

    /**
     * Inject couponsService
     */

    private readonly couponsService: CouponsService,
    private readonly orderEmailProvider: OrderEmailProvider,
  ) {}

  async updateStatus(id: number, status: OrderStatus) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.course', 'user'],
    });

    if (!order) throw new NotFoundException('Order not found');

    // 🔥 RULES
    if (order.status === OrderStatus.PAID && status !== OrderStatus.PAID) {
      throw new BadRequestException('Cannot downgrade paid order');
    }

    const previousStatus = order.status;
    order.status = status;

    // 🔥 OPTIONAL: paidAt set only if admin marks paid
    if (status === OrderStatus.PAID && !order.paidAt) {
      order.paidAt = new Date();
    }
    const savedOrder = await this.orderRepository.save(order);

    if (status === OrderStatus.PAID) {
      await this.couponsService.applyCouponUsage(savedOrder);
      const enrollments = await this.enrollmentsService.enrollUser(savedOrder);
      await this.orderEmailProvider.sendPurchaseAndEnrollmentEmails(
        savedOrder,
        enrollments,
      );
    }

    if (
      status === OrderStatus.CANCELLED &&
      previousStatus !== OrderStatus.CANCELLED
    ) {
      await this.orderEmailProvider.sendOrderCancelledEmail(savedOrder);
    }

    if (status === OrderStatus.FAILED && previousStatus !== OrderStatus.FAILED) {
      await this.orderEmailProvider.sendPaymentFailedEmail(savedOrder);
    }

    return savedOrder;
  }
}
