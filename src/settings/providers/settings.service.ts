import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentGateway } from '../payment-gateway.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CryptoService } from 'src/common/crypto/providers/crypto.service';
import { PaymentProvider } from '../enums/payment-provider.enum';
import { PaymentMode } from '../enums/payment-mode.enum';
import { UpsertPaymentGatewayDto } from '../dtos/upsert-payment-gateway.dto';

@Injectable()
export class SettingsService {
  constructor(
    /**
     * Inject paymentGatewayRepository
     */
    @InjectRepository(PaymentGateway)
    private readonly paymentGatewayRepository: Repository<PaymentGateway>,

    /**
     * Inject cryptoService
     */
    private readonly cryptoService: CryptoService,
  ) {}

  async getAllGateways() {
    const result = await this.paymentGatewayRepository.find({
      order: { provider: 'ASC', mode: 'ASC' },
    });
    if (!result) {
      throw new NotFoundException('No payment gateways found');
    }
    return result.map((gateway) => this.toAdminGateway(gateway));
  }

  async getAllActiveGateways() {
    const gateways = await this.paymentGatewayRepository.find({
      where: { isActive: true },
    });

    if (!gateways.length) {
      return []; // ❗ throw mat kar — frontend handle karega
    }

    return gateways.map((g) => ({
      provider: g.provider,
      displayName: this.getDisplayName(g.provider),
    }));
  }

  async upsertGateway(upsertPaymentGatewayDto: UpsertPaymentGatewayDto) {
    let entity = await this.paymentGatewayRepository.findOne({
      where: {
        provider: upsertPaymentGatewayDto.provider,
        mode: upsertPaymentGatewayDto.mode,
      },
    });

    const isNewGateway = !entity;

    if (!entity) {
      entity = this.paymentGatewayRepository.create({
        provider: upsertPaymentGatewayDto.provider,
        mode: upsertPaymentGatewayDto.mode,
      });
    }

    if (
      isNewGateway &&
      (!upsertPaymentGatewayDto.keyId || !upsertPaymentGatewayDto.keySecret)
    ) {
      throw new BadRequestException(
        'Key ID and key secret are required for a new payment gateway',
      );
    }

    // 🔐 encrypt only if provided
    if (upsertPaymentGatewayDto.keyId) {
      entity.keyIdEnc = this.cryptoService.encrypt(
        upsertPaymentGatewayDto.keyId,
      );
    }

    if (upsertPaymentGatewayDto.keySecret) {
      entity.keySecretEnc = this.cryptoService.encrypt(
        upsertPaymentGatewayDto.keySecret,
      );
    }

    if (upsertPaymentGatewayDto.webhookSecret) {
      entity.webhookSecretEnc = this.cryptoService.encrypt(
        upsertPaymentGatewayDto.webhookSecret,
      );
    }

    if (upsertPaymentGatewayDto.webhookUrl !== undefined) {
      entity.webhookUrl = upsertPaymentGatewayDto.webhookUrl;
    }

    if (upsertPaymentGatewayDto.isActive) {
      await this.paymentGatewayRepository.update(
        { provider: upsertPaymentGatewayDto.provider },
        { isActive: false },
      );
      entity.isActive = true;
    } else {
      entity.isActive = false;
    }

    const savedGateway = await this.paymentGatewayRepository.save(entity);

    return this.toAdminGateway(savedGateway);
  }

  async getActiveGateway(provider: PaymentProvider) {
    const cfg = await this.paymentGatewayRepository.findOne({
      where: { provider, isActive: true },
    });
    if (!cfg) throw new NotFoundException('Payment gateway not configured');

    return {
      keyId: this.cryptoService.decrypt(cfg.keyIdEnc),
      keySecret: this.cryptoService.decrypt(cfg.keySecretEnc),
      webhookSecret: cfg.webhookSecretEnc
        ? this.cryptoService.decrypt(cfg.webhookSecretEnc)
        : null,
      webhookUrl: cfg.webhookUrl || null,
      mode: cfg.mode,
    };
  }

  async getWebhookSecret() {
    const config = await this.paymentGatewayRepository.findOne({
      where: { isActive: true },
    });

    return config && this.cryptoService.decrypt(config.webhookSecretEnc);
  }

  async getPublicConfig() {
    const config = await this.paymentGatewayRepository.findOne({
      where: {
        provider: PaymentProvider.RAZORPAY,
        isActive: true,
      },
    });

    if (!config) {
      throw new Error('No active payment config');
    }

    return {
      keyId: this.cryptoService.decrypt(config.keyIdEnc), // ✅ only this
    };
  }
  private getDisplayName(provider: PaymentProvider): string {
    switch (provider) {
      case PaymentProvider.RAZORPAY:
        return 'Razorpay';
      case PaymentProvider.STRIPE:
        return 'Stripe';
      case PaymentProvider.PAYPAL:
        return 'PayPal';
      default:
        return provider;
    }
  }

  private toAdminGateway(gateway: PaymentGateway) {
    return {
      id: gateway.id,
      provider: gateway.provider,
      displayName: this.getDisplayName(gateway.provider),
      mode: gateway.mode,
      isActive: gateway.isActive,
      keyIdPreview: this.getMaskedSecret(gateway.keyIdEnc),
      hasKeySecret: Boolean(gateway.keySecretEnc),
      hasWebhookSecret: Boolean(gateway.webhookSecretEnc),
      webhookUrl: gateway.webhookUrl || null,
      createdAt: gateway.createdAt,
      updatedAt: gateway.updatedAt,
    };
  }

  private getMaskedSecret(encryptedValue?: string | null) {
    if (!encryptedValue) return null;

    try {
      const decryptedValue = this.cryptoService.decrypt(encryptedValue);
      if (!decryptedValue) return null;

      return `${decryptedValue.slice(0, 6)}****${decryptedValue.slice(-4)}`;
    } catch {
      return '********';
    }
  }
}
