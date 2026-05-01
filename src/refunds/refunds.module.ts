import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnrollmentsModule } from 'src/enrollments/enrollments.module';
import { Order } from 'src/orders/order.entity';
import { PaymentsModule } from 'src/payments/payments.module';
import { User } from 'src/users/user.entity';
import { RefundLog } from './refund-log.entity';
import { RefundRequest } from './refund-request.entity';
import { RefundsController } from './refunds.controller';
import { RefundsService } from './providers/refunds.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefundRequest, RefundLog, Order, User]),
    PaymentsModule,
    EnrollmentsModule,
  ],
  controllers: [RefundsController],
  providers: [RefundsService],
  exports: [RefundsService],
})
export class RefundsModule {}
