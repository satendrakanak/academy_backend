import { Module } from '@nestjs/common';
import { CryptoService } from './providers/crypto.service';

@Module({
  providers: [CryptoService],
  exports: [CryptoService],
})
export class CryptoModule {}
