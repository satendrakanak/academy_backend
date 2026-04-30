import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { SettingsService } from './providers/settings.service';
import { UpsertPaymentGatewayDto } from './dtos/upsert-payment-gateway.dto';
import { PaymentProvider } from './enums/payment-provider.enum';

@Controller('settings')
export class SettingsController {
  constructor(
    /**
     * Inject settingsService
     */
    private readonly settingsService: SettingsService,
  ) {}

  @Post('gateway')
  async createOrUpdate(
    @Body() upsertPaymentGatewayDto: UpsertPaymentGatewayDto,
  ) {
    return await this.settingsService.upsertGateway(upsertPaymentGatewayDto);
  }

  @Get('gateway')
  async getActiveGateway(@Query('provider') provider: PaymentProvider) {
    return this.settingsService.getActiveGateway(provider);
  }

  @Get('gateways')
  async getAllGateways() {
    return this.settingsService.getAllGateways();
  }

  @Get('gateways/active')
  async getAllActiveGateways() {
    return this.settingsService.getAllActiveGateways();
  }

  @Get('payment-config')
  getPaymentConfig() {
    return this.settingsService.getPublicConfig();
  }
}
