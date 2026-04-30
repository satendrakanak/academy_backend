import { Injectable } from '@nestjs/common';
import { VerificationTokenService } from './verification-token.service';
import { GenerateVerficationTokenDto } from '../dtos/generate-verfification-token.dto';
import { randomUUID } from 'crypto';
import { TokenType } from '../enums/token-type.enum';

@Injectable()
export class GenerateVerificationTokenProvider {
  constructor(
    /**
     * Inject verificationTokenService
     */
    private readonly verificationTokenService: VerificationTokenService,
  ) {}

  async generate(generateVerficationTokenDto: GenerateVerficationTokenDto) {
    await this.verificationTokenService.deletePendingTokensForUser(
      generateVerficationTokenDto.userId,
      generateVerficationTokenDto.type,
    );

    const token =
      generateVerficationTokenDto.type === TokenType.CHECKOUT_EMAIL_OTP
        ? Math.floor(100000 + Math.random() * 900000).toString()
        : randomUUID();

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    return await this.verificationTokenService.create({
      userId: generateVerficationTokenDto.userId,
      token,
      type: generateVerficationTokenDto.type,
      expiresAt,
    });
  }
}
