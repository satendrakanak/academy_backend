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
  ) {}
  async create(createOrderDto: CreateOrderDto, user: ActiveUserData) {
    // 🔥 1. Extract courseIds
    const courseIds = createOrderDto.items.map((i) => i.courseId);

    // 🔥 2. Fetch courses
    const courses = await this.coursesService.findManyByIds(courseIds);

    if (courses.length !== courseIds.length) {
      throw new BadRequestException('Invalid courses');
    }

    // 🔥 3. Duplicate purchase check (FIXED)
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

    // 🔥 4. Pricing (INTEGER SAFE)
    const subTotal = courses.reduce((sum, c) => sum + Number(c.priceInr), 0);

    const taxRate = 0.18;

    const baseAmount = Math.round(subTotal / (1 + taxRate));
    const tax = subTotal - baseAmount;

    const discount = 0;
    const totalAmount = subTotal - discount;
    // 🔥 5. Create order
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
      items: courses.map((course) => ({
        course: { id: course.id },
        price: Number(course.priceInr),
        quantity: 1,
      })),
    });

    await this.orderRepository.save(order);

    // 🔥 6. Razorpay order create (IMPORTANT: rupees → paise)
    const razorpayOrder = await this.paymentsService.createOrder(
      totalAmount,
      `order_${order.id}`,
    );

    // 🔥 7. Update SAME order (FIXED)
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
