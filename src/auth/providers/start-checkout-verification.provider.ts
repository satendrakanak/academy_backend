import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/user.entity';
import { StartCheckoutVerificationDto } from '../dtos/start-checkout-verification.dto';
import { UsersService } from 'src/users/providers/users.service';
import { GenerateVerificationTokenProvider } from './generate-verification-token.provider';
import { MailService } from 'src/mail/providers/mail.service';
import { TokenType } from '../enums/token-type.enum';

@Injectable()
export class StartCheckoutVerificationProvider {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly usersService: UsersService,
    private readonly generateVerificationTokenProvider: GenerateVerificationTokenProvider,
    private readonly mailService: MailService,
  ) {}

  async start(startCheckoutVerificationDto: StartCheckoutVerificationDto) {
    const email = startCheckoutVerificationDto.email.trim().toLowerCase();
    const phoneNumber = startCheckoutVerificationDto.phoneNumber.trim();

    const existingByEmail = await this.userRepository.findOne({
      where: { email },
      relations: ['roles'],
    });

    const existingByPhone = await this.userRepository.findOne({
      where: { phoneNumber },
    });

    if (existingByEmail?.emailVerified) {
      throw new ConflictException(
        'An account already exists with this email. Please sign in to continue.',
      );
    }

    if (existingByPhone && existingByPhone.email !== email) {
      throw new ConflictException(
        'An account already exists with this phone number.',
      );
    }

    if (existingByEmail) {
      existingByEmail.firstName = startCheckoutVerificationDto.firstName.trim();
      existingByEmail.lastName = startCheckoutVerificationDto.lastName.trim();
      existingByEmail.phoneNumber = phoneNumber;

      const updatedUser = await this.userRepository.save(existingByEmail);
      await this.sendCheckoutOtp(updatedUser);

      return {
        email,
        maskedEmail: this.maskEmail(email),
        isExistingUser: true,
      };
    }

    const newUser = await this.usersService.create(
      {
        firstName: startCheckoutVerificationDto.firstName.trim(),
        lastName: startCheckoutVerificationDto.lastName.trim(),
        email,
        phoneNumber,
        password: 'Temp@1234',
      },
      undefined,
      { verificationMode: 'otp' },
    );

    if (!newUser) {
      throw new BadRequestException('Unable to start checkout verification');
    }

    return {
      email,
      maskedEmail: this.maskEmail(email),
      isExistingUser: false,
    };
  }

  private async sendCheckoutOtp(user: User) {
    const tokenRecord = await this.generateVerificationTokenProvider.generate({
      userId: user.id,
      type: TokenType.CHECKOUT_EMAIL_OTP,
    });

    await this.mailService.sendCheckoutOtpEmail(
      user,
      tokenRecord.token,
      tokenRecord.expiresAt,
    );
  }

  private maskEmail(email: string) {
    const [name, domain] = email.split('@');
    if (!name || !domain) return email;

    if (name.length <= 2) {
      return `${name[0] || '*'}*@${domain}`;
    }

    return `${name.slice(0, 2)}${'*'.repeat(Math.max(2, name.length - 2))}@${domain}`;
  }
}
