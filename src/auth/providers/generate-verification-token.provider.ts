import { Injectable } from '@nestjs/common';
import { VerificationTokenService } from './verification-token.service';
import { GenerateVerficationTokenDto } from '../dtos/generate-verfification-token.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class GenerateVerificationTokenProvider {
  constructor(
    /**
     * Inject verificationTokenService
     */
    private readonly verificationTokenService: VerificationTokenService,
  ) {}

  async generate(generateVerficationTokenDto: GenerateVerficationTokenDto) {
    const token = randomUUID();

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    return await this.verificationTokenService.create({
      userId: generateVerficationTokenDto.userId,
      token,
      type: generateVerficationTokenDto.type,
      expiresAt,
    });
  }
}
