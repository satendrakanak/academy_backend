import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import Razorpay from 'razorpay';
import { PaymentProvider } from 'src/settings/enums/payment-provider.enum';
import { SettingsService } from 'src/settings/providers/settings.service';

@Injectable()
export class RazorpayProvider {
  constructor(
    /**
     * Inject settingsService
     */

    private readonly settingsService: SettingsService,
  ) {}

  async createOrder(amount: number, receipt: string) {
    if (!amount || amount <= 0) {
      throw new BadRequestException('Invalid amount');
    }
    if (!receipt) {
      throw new BadRequestException('Receipt is required');
    }

    const config = await this.settingsService.getActiveGateway(
      PaymentProvider.RAZORPAY,
    );

    if (!config) {
      throw new ServiceUnavailableException('Payment gateway not configured');
    }

    const { keyId, keySecret } = config;

    if (!keyId || !keySecret) {
      throw new ServiceUnavailableException(
        'Payment gateway credentials are missing',
      );
    }

    try {
      const instance = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

      const razorOrder = await instance.orders.create({
        amount: Math.round(amount * 100), // ₹ → paise
        currency: 'INR',
        receipt,
      });

      if (!razorOrder) {
        throw new InternalServerErrorException('Failed to create order');
      }

      return razorOrder;
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to update course');
    }
  }

  async refundPayment(
    paymentId: string,
    amount: number,
    notes?: Record<string, string>,
  ) {
    if (!paymentId) {
      throw new BadRequestException('Payment id is required');
    }

    if (!amount || amount <= 0) {
      throw new BadRequestException('Invalid refund amount');
    }

    const config = await this.settingsService.getActiveGateway(
      PaymentProvider.RAZORPAY,
    );

    if (!config) {
      throw new ServiceUnavailableException('Payment gateway not configured');
    }

    const { keyId, keySecret } = config;

    if (!keyId || !keySecret) {
      throw new ServiceUnavailableException(
        'Payment gateway credentials are missing',
      );
    }

    try {
      const instance = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

      return await instance.payments.refund(paymentId, {
        amount: Math.round(amount * 100),
        speed: 'normal',
        notes,
      });
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to create refund');
    }
  }

  async fetchRefund(paymentId: string, refundId: string) {
    if (!paymentId || !refundId) {
      throw new BadRequestException('Payment id and refund id are required');
    }

    const config = await this.settingsService.getActiveGateway(
      PaymentProvider.RAZORPAY,
    );

    if (!config) {
      throw new ServiceUnavailableException('Payment gateway not configured');
    }

    const { keyId, keySecret } = config;

    if (!keyId || !keySecret) {
      throw new ServiceUnavailableException(
        'Payment gateway credentials are missing',
      );
    }

    try {
      const instance = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

      return await instance.payments.fetchRefund(paymentId, refundId);
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to fetch refund status');
    }
  }
}
