import { Injectable, NotFoundException } from '@nestjs/common';
import { Order } from '../order.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderStatus } from '../enums/orderStatus.enum';
import { EnrollmentsService } from 'src/enrollments/providers/enrollments.service';
import { CouponsService } from 'src/coupons/providers/coupons.service';

@Injectable()
export class ChangeOrderStatusProvider {
  constructor(
    /**
     * Inject orderRepository
     */
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
  ) {}
  async markAsPaid(
    orderId: number,
    razorpayOrderId: string,
    paymentId: string,
  ) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, orderId: razorpayOrderId },
      relations: ['items', 'items.course', 'user'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    order.status = OrderStatus.PAID;
    order.paymentId = paymentId;
    order.paidAt = new Date();

    await this.orderRepository.save(order);

    // MANUAL
    if (order.manualCouponCode) {
      const manualCoupon = await this.couponsService.findByCode(
        order.manualCouponCode,
      );

      if (manualCoupon) {
        await this.couponsService.markCouponUsed(
          manualCoupon.id,
          order.user.id,
          order,
        );
      }
    }

    // Auto
    if (order.autoCouponCode) {
      const autoCoupon = await this.couponsService.findByCode(
        order.autoCouponCode,
      );

      if (autoCoupon) {
        await this.couponsService.markCouponUsed(
          autoCoupon.id,
          order.user.id,
          order,
        );
      }
    }

    await this.enrollmentsService.enrollUser(order);

    return order;
  }

  async markAsFailed(
    orderId: number,
    razorpayOrderId: string,
    paymentId: string,
  ) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, orderId: razorpayOrderId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    order.status = OrderStatus.FAILED;
    order.paymentId = paymentId;
    order.failedAt = new Date();

    await this.orderRepository.save(order);

    return order;
  }
}
