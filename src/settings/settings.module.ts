import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './providers/settings.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentGateway } from './payment-gateway.entity';
import { CryptoModule } from 'src/common/crypto/crypto.module';
import { AppSetting } from './app-setting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentGateway, AppSetting]), CryptoModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
