import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { VerificationToken } from '../verification-token.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateVerficationTokenDto } from '../dtos/create-verification-token.dto';
import { GetValidTokenDto } from '../dtos/get-valid-token.dto';
import { TokenType } from '../enums/token-type.enum';

@Injectable()
export class VerificationTokenService {
  constructor(
    /**
     * Inject verficationTokenRepository
     */

    @InjectRepository(VerificationToken)
    private readonly verficationTokenRepository: Repository<VerificationToken>,
  ) {}

  async create(
    createVerficationTokenDto: CreateVerficationTokenDto,
  ): Promise<VerificationToken> {
    const token = this.verficationTokenRepository.create(
      createVerficationTokenDto,
    );
    return await this.verficationTokenRepository.save(token);
  }

  async getValidToken(
    getValidTokenDto: GetValidTokenDto,
  ): Promise<VerificationToken> {
    const token = await this.verficationTokenRepository.findOne({
      where: {
        token: getValidTokenDto.token,
        type: getValidTokenDto.type,
      },
    });

    if (!token) throw new BadRequestException('Invalid token');

    if (token.usedAt) {
      throw new BadRequestException('Token already used');
    }

    if (token.expiresAt < new Date()) {
      throw new BadRequestException('Token expired');
    }

    return token;
  }

  async delete(token: VerificationToken): Promise<VerificationToken> {
    return await this.verficationTokenRepository.remove(token);
  }

  async markUsed(token: VerificationToken): Promise<VerificationToken> {
    token.usedAt = new Date();
    return await this.verficationTokenRepository.save(token);
  }

  async deletePendingTokensForUser(
    userId: number,
    type: TokenType,
  ): Promise<void> {
    await this.verficationTokenRepository.delete({
      userId,
      type,
    });
  }
}
