import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/user.entity';
import { SignupDto } from '../dtos/sign-up.dto';
import { UsersService } from 'src/users/providers/users.service';
import { HashingProvider } from './hashing.provider';
import { GenerateVerificationTokenProvider } from './generate-verification-token.provider';
import { MailService } from 'src/mail/providers/mail.service';
import { TokenType } from '../enums/token-type.enum';

@Injectable()
export class StartSignupVerificationProvider {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly usersService: UsersService,
    private readonly hashingProvider: HashingProvider,
    private readonly generateVerificationTokenProvider: GenerateVerificationTokenProvider,
    private readonly mailService: MailService,
  ) {}

  async start(signupDto: SignupDto) {
    const email = signupDto.email.trim().toLowerCase();
    const phoneNumber = signupDto.phoneNumber?.trim() || '';
    const lastName = signupDto.lastName?.trim() || '';

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

    if (
      existingByPhone &&
      existingByPhone.email !== email &&
      existingByPhone.emailVerified
    ) {
      throw new ConflictException(
        'An account already exists with this phone number.',
      );
    }

    if (existingByEmail) {
      existingByEmail.firstName = signupDto.firstName.trim();
      existingByEmail.lastName = lastName;
      existingByEmail.phoneNumber = phoneNumber;
      existingByEmail.password = await this.hashingProvider.hashPassword(
        signupDto.password,
      );

      const updatedUser = await this.userRepository.save(existingByEmail);
      await this.sendSignupOtp(updatedUser);

      return {
        email,
        maskedEmail: this.maskEmail(email),
        isExistingUser: true,
      };
    }

    const newUser = await this.usersService.create(
      {
        firstName: signupDto.firstName.trim(),
        lastName,
        email,
        phoneNumber,
        password: signupDto.password,
      },
      undefined,
      { verificationMode: 'none' },
    );

    if (!newUser) {
      throw new NotFoundException('Unable to start registration verification');
    }

    await this.sendSignupOtp(newUser);

    return {
      email,
      maskedEmail: this.maskEmail(email),
      isExistingUser: false,
    };
  }

  private async sendSignupOtp(user: User) {
    const tokenRecord = await this.generateVerificationTokenProvider.generate({
      userId: user.id,
      type: TokenType.EMAIL_OTP_VERIFICATION,
    });

    await this.mailService.sendRegistrationOtpEmail(
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
