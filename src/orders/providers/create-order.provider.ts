import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateOrderDto } from '../dtos/create-order.dto';
import { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { CoursesService } from 'src/courses/providers/courses.service';
import { OrderItem } from '../order-item.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from '../order.entity';
import { In, Repository } from 'typeorm';
import { PaymentsService } from 'src/payments/providers/payments.service';
import { OrderStatus } from '../enums/orderStatus.enum';
import { CouponsService } from 'src/coupons/providers/coupons.service';

@Injectable()
export class CreateOrderProvider {
  constructor(
    /**
     * Inject orderRepository
     * */
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    /**
     * Inject orderItemRepository
     */
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,

    /**
     * Inject coursesService
     */

    private readonly coursesService: CoursesService,

    /**
     * Inject paymentsService
     */

    private readonly paymentsService: PaymentsService,

    /**
     * Inject couponsService
     */
    private readonly couponsService: CouponsService,
  ) {}
  async create(createOrderDto: CreateOrderDto, user: ActiveUserData) {
    const courseIds = createOrderDto.items.map((i) => i.courseId);

    // 🔥 1. Fetch courses
    const courses = await this.coursesService.findManyByIds(courseIds);

    if (courses.length !== courseIds.length) {
      throw new BadRequestException('Invalid courses');
    }

    // 🔥 2. Duplicate purchase check
    const existing = await this.orderItemRepository.find({
      where: {
        course: { id: In(courseIds) },
        order: {
          user: { id: user.sub },
          status: OrderStatus.PAID,
        },
      },
      relations: ['order'],
    });

    if (existing.length > 0) {
      throw new BadRequestException('Course already purchased');
    }

    // ===============================
    // 🔥 3. ORIGINAL PRICE (GST INCLUDED)
    // ===============================
    const originalPrice = courses.reduce(
      (sum, c) => sum + Number(c.priceInr),
      0,
    );

    // ===============================
    // 🔥 4. COUPON APPLY
    // ===============================
    const pricing = await this.couponsService.applyStackedCoupons(
      user.sub,
      originalPrice,
      courseIds,
      createOrderDto.couponCode, // manual coupon
    );
    const discount = pricing.totalDiscount;
    const totalAmount = pricing.finalAmount;

    const autoCouponCode = pricing.autoCoupon?.code || null;
    const manualCouponCode = pricing.manualCoupon?.code || null;

    // ===============================
    // 🔥 6. REVERSE GST (IMPORTANT)
    // ===============================
    const subTotal = Math.round(totalAmount / 1.18);
    const tax = totalAmount - subTotal;

    // ===============================
    // 🔥 7. TAMPERING CHECK
    // ===============================
    if (
      createOrderDto.totalAmount &&
      Math.abs(createOrderDto.totalAmount - totalAmount) > 1
    ) {
      throw new BadRequestException('Price mismatch detected');
    }

    // ===============================
    // 🔥 8. CREATE ORDER
    // ===============================
    const order = this.orderRepository.create({
      user: { id: user.sub },
      subTotal,
      discount,
      tax,
      totalAmount,
      currency: 'INR',
      status: OrderStatus.PENDING,
      billingAddress: createOrderDto.billingAddress,
      paymentMethod: createOrderDto.paymentMethod || 'RAZORPAY',
      manualCouponCode: manualCouponCode,
      autoCouponCode: autoCouponCode,
      items: courses.map((course) => ({
        course: { id: course.id },
        price: Number(course.priceInr),
        quantity: 1,
      })),
    });

    await this.orderRepository.save(order);

    // ===============================
    // 🔥 9. RAZORPAY ORDER
    // ===============================
    const razorpayOrder = await this.paymentsService.createOrder(
      totalAmount,
      `order_${order.id}`,
    );

    order.orderId = razorpayOrder.id;
    await this.orderRepository.save(order);

    return {
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      courses: courses.map((course) => ({
        id: course.id,
        slug: course.slug,
        title: course.title,
      })),
    };
  }
}
