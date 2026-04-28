import { forwardRef, Module } from '@nestjs/common';
import { PaymentsService } from './providers/payments.service';
import { RazorpayProvider } from './providers/razorpay.provider';
import { SettingsModule } from 'src/settings/settings.module';
import { PaymentsController } from './payments.controller';
import { OrdersModule } from 'src/orders/orders.module';

@Module({
  imports: [SettingsModule, forwardRef(() => OrdersModule)],
  providers: [PaymentsService, RazorpayProvider],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
