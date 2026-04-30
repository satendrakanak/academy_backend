import { forwardRef, Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './providers/orders.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { CoursesModule } from 'src/courses/courses.module';
import { PaymentsModule } from 'src/payments/payments.module';
import { SettingsModule } from 'src/settings/settings.module';
import { HandleWebhookProvider } from './providers/handle-webhook.provider';
import { ChangeOrderStatusProvider } from './providers/change-order-status.provider';
import { CreateOrderProvider } from './providers/create-order.provider';
import { RetryPaymentProvider } from './providers/retry-payment.provider';
import { EnrollmentsModule } from 'src/enrollments/enrollments.module';
import { CouponsModule } from 'src/coupons/coupons.module';
import { UsersModule } from 'src/users/users.module';
import { UpdateOrderStatusByAdminProvider } from './providers/update-order-status-by-admin.provider';
import { EmailTemplatesModule } from 'src/email-templates/email-templates.module';
import { OrderEmailProvider } from './providers/email/order-email.provider';
import { CartsModule } from 'src/carts/carts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    forwardRef(() => CoursesModule),
    forwardRef(() => PaymentsModule),
    SettingsModule,
    EnrollmentsModule,
    CouponsModule,
    UsersModule,
    EmailTemplatesModule,
    CartsModule,
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    HandleWebhookProvider,
    ChangeOrderStatusProvider,
    CreateOrderProvider,
    RetryPaymentProvider,
    UpdateOrderStatusByAdminProvider,
    OrderEmailProvider,
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
