import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { SettingsService } from './providers/settings.service';
import { UpsertPaymentGatewayDto } from './dtos/upsert-payment-gateway.dto';
import { PaymentProvider } from './enums/payment-provider.enum';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import { UpsertSiteSettingsDto } from './dtos/upsert-site-settings.dto';
import { UpsertEmailSettingsDto } from './dtos/upsert-email-settings.dto';
import { UpsertSocialAuthSettingsDto } from './dtos/upsert-social-auth-settings.dto';
import { UpsertAwsStorageSettingsDto } from './dtos/upsert-aws-storage-settings.dto';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post('gateway')
  async createOrUpdate(
    @Body() upsertPaymentGatewayDto: UpsertPaymentGatewayDto,
  ) {
    return this.settingsService.upsertGateway(upsertPaymentGatewayDto);
  }

  @Get('gateway')
  async getActiveGateway(@Query('provider') provider: PaymentProvider) {
    return this.settingsService.getActiveGateway(provider);
  }

  @Get('gateways')
  async getAllGateways() {
    return this.settingsService.getAllGateways();
  }

  @Auth(AuthType.None)
  @Get('gateways/active')
  async getAllActiveGateways() {
    return this.settingsService.getAllActiveGateways();
  }

  @Auth(AuthType.None)
  @Get('payment-config')
  getPaymentConfig() {
    return this.settingsService.getPublicConfig();
  }

  @Get('site')
  getSiteSettings() {
    return this.settingsService.getSiteSettings();
  }

  @Post('site')
  upsertSiteSettings(@Body() payload: UpsertSiteSettingsDto) {
    return this.settingsService.upsertSiteSettings(payload);
  }

  @Get('email')
  getEmailSettings() {
    return this.settingsService.getEmailSettings();
  }

  @Post('email')
  upsertEmailSettings(@Body() payload: UpsertEmailSettingsDto) {
    return this.settingsService.upsertEmailSettings(payload);
  }

  @Get('social-auth')
  getSocialAuthSettings() {
    return this.settingsService.getSocialAuthSettings();
  }

  @Post('social-auth')
  upsertSocialAuthSettings(@Body() payload: UpsertSocialAuthSettingsDto) {
    return this.settingsService.upsertSocialAuthSettings(payload);
  }

  @Auth(AuthType.None)
  @Get('social-auth/active')
  getActiveSocialAuthSettings() {
    return this.settingsService.getActiveSocialProviders();
  }

  @Auth(AuthType.None)
  @Get('public')
  getPublicSettingsBundle() {
    return this.settingsService.getPublicSettingsBundle();
  }

  @Get('aws-storage')
  getAwsStorageSettings() {
    return this.settingsService.getAwsStorageSettings();
  }

  @Post('aws-storage')
  upsertAwsStorageSettings(@Body() payload: UpsertAwsStorageSettingsDto) {
    return this.settingsService.upsertAwsStorageSettings(payload);
  }
}
