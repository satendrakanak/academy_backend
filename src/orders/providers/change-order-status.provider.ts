import { Injectable, NotFoundException } from '@nestjs/common';
import { Order } from '../order.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderStatus } from '../enums/orderStatus.enum';
import { EnrollmentsService } from 'src/enrollments/providers/enrollments.service';
import { CouponsService } from 'src/coupons/providers/coupons.service';
import { OrderEmailProvider } from './email/order-email.provider';
import { CartsService } from 'src/carts/providers/carts.service';
import { PaymentDetails } from '../interfaces/payment-details.interface';
import { FailedPaymentDetails } from '../interfaces/failed-payment-details.interface';

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

    private readonly orderEmailProvider: OrderEmailProvider,
    private readonly cartsService: CartsService,
  ) {}
  async markAsPaid(
    orderId: number,
    razorpayOrderId: string,
    paymentId: string,
    paymentDetails?: PaymentDetails,
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
    order.paymentMethod = 'RAZORPAY';
    order.paymentMode = paymentDetails?.method || null;
    order.paymentBank = paymentDetails?.bank || null;
    order.paymentWallet = paymentDetails?.wallet || null;
    order.paymentVpa = paymentDetails?.vpa || null;
    order.paymentCardId = paymentDetails?.cardId || null;

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

    const enrollments = await this.enrollmentsService.enrollUser(order);

    await this.orderEmailProvider.sendPurchaseAndEnrollmentEmails(
      order,
      enrollments,
    );
    await this.cartsService.clear(order.user.id);

    return order;
  }

  async markAsFailed(
    orderId: number,
    razorpayOrderId: string,
    paymentId: string,
    paymentDetails?: FailedPaymentDetails,
  ) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, orderId: razorpayOrderId },
      relations: ['items', 'items.course', 'user'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    order.status = OrderStatus.FAILED;
    order.paymentId = paymentId;
    order.failedAt = new Date();
    order.paymentMode = paymentDetails?.method || null;
    order.paymentBank = paymentDetails?.bank || null;
    order.paymentWallet = paymentDetails?.wallet || null;
    order.paymentVpa = paymentDetails?.vpa || null;
    order.paymentCardId = paymentDetails?.cardId || null;

    order.paymentErrorCode = paymentDetails?.errorCode || null;
    order.paymentErrorMessage = paymentDetails?.errorDescription || null;

    await this.orderRepository.save(order);

    await this.orderEmailProvider.sendPaymentFailedEmail(order);

    return order;
  }
}
