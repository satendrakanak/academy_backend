import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/user.entity';
import { VerificationTokenService } from './verification-token.service';
import { TokenType } from '../enums/token-type.enum';
import { UsersService } from 'src/users/providers/users.service';
import { GenerateTokensProvider } from './generate-tokens.provider';
import { MailService } from 'src/mail/providers/mail.service';

@Injectable()
export class VerifyCheckoutOtpProvider {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly verificationTokenService: VerificationTokenService,
    private readonly usersService: UsersService,
    private readonly generateTokensProvider: GenerateTokensProvider,
    private readonly mailService: MailService,
  ) {}

  async verify(email: string, code: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const sanitizedCode = code.trim();

    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
      relations: ['roles'],
    });

    if (!user) {
      throw new BadRequestException('Account not found for this email.');
    }

    const record = await this.verificationTokenService.getValidToken({
      token: sanitizedCode,
      type: TokenType.CHECKOUT_EMAIL_OTP,
    });

    if (record.userId !== user.id) {
      throw new BadRequestException('Invalid verification code.');
    }

    const wasAlreadyVerified = Boolean(user.emailVerified);
    const verifiedUser = wasAlreadyVerified
      ? user
      : await this.usersService.markEmailVerified(user.id);

    await this.verificationTokenService.delete(record);
    if (!wasAlreadyVerified) {
      await this.mailService.sendWelcomeEmail(verifiedUser);
    }

    const freshUser = await this.userRepository.findOne({
      where: { id: verifiedUser.id },
      relations: ['roles'],
    });

    return this.generateTokensProvider.generateTokens(freshUser || verifiedUser);
  }
}
