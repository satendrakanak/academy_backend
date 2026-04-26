import { Injectable } from '@nestjs/common';
import { RazorpayProvider } from './razorpay.provider';

@Injectable()
export class PaymentsService {
  constructor(
    /**
     * Inject razorpayProvider
     */

    private readonly razorpayProvider: RazorpayProvider,
  ) {}

  async createOrder(amount: number, receipt: string) {
    return await this.razorpayProvider.createOrder(amount, receipt);
  }
}
