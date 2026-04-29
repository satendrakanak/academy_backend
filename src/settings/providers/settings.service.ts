import { Injectable, NotFoundException } from '@nestjs/common';
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
    const result = await this.paymentGatewayRepository.find();
    if (!result) {
      throw new NotFoundException('No payment gateways found');
    }
    return result;
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

    if (!entity) {
      entity = this.paymentGatewayRepository.create({
        provider: upsertPaymentGatewayDto.provider,
        mode: upsertPaymentGatewayDto.mode,
      });
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
    if (upsertPaymentGatewayDto.isActive) {
      await this.paymentGatewayRepository.update(
        { provider: upsertPaymentGatewayDto.provider },
        { isActive: false },
      );
      entity.isActive = true;
    } else {
      entity.isActive = false;
    }

    return this.paymentGatewayRepository.save(entity);
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
}
