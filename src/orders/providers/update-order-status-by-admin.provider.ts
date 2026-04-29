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

    order.status = status;

    // 🔥 OPTIONAL: paidAt set only if admin marks paid
    if (status === OrderStatus.PAID && !order.paidAt) {
      order.paidAt = new Date();
    }
    await this.couponsService.applyCouponUsage(order);

    await this.enrollmentsService.enrollUser(order);

    return await this.orderRepository.save(order);
  }
}
