import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { SignInDto } from '../dtos/sign-in.dto';
import { SignInProvider } from './sign-in.provider';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { RefreshTokensProvider } from './refresh-tokens.provider';
import { SignupDto } from '../dtos/sign-up.dto';
import { UsersService } from 'src/users/providers/users.service';
import { VerifyEmailProvider } from './verify-email.provider';
import { User } from 'src/users/user.entity';
import { GenerateVerificationTokenProvider } from './generate-verification-token.provider';
import { TokenType } from '../enums/token-type.enum';
import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/mail/providers/mail.service';

@Injectable()
export class AuthService {
  constructor(
    /**
     * Inject signInProvider
     */
    private readonly signInProvider: SignInProvider,

    /**
     * Inject usersService
     */
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,

    /**
     * Inject refreshTokensProvider
     */

    private readonly refreshTokensProvider: RefreshTokensProvider,

    /**
     * Inject verifyEmailProvider
     */

    private readonly verfiyEmailProvider: VerifyEmailProvider,

    /**
     * Inject generateVerificationTokenProvider
     */

    private readonly generateVerificationTokenProvider: GenerateVerificationTokenProvider,

    /**
     * Inject configService
     */

    private readonly configService: ConfigService,

    /**
     * Inject mailService
     */
    private readonly mailService: MailService,
  ) {}

  public async signIn(signInDto: SignInDto) {
    return this.signInProvider.signIn(signInDto);
  }

  public async signUp(signupDto: SignupDto) {
    return this.usersService.create(signupDto);
  }

  public async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    return await this.refreshTokensProvider.refreshTokens(refreshTokenDto);
  }

  async sendVerificationEmail(user: User) {
    const tokenRecord = await this.generateVerificationTokenProvider.generate({
      userId: user.id,
      type: TokenType.EMAIL_VERIFICATION,
    });

    const link = `${this.configService.get<string>('appConfig.fronEndUrl')}/auth/verify-email?token=${tokenRecord.token}`;

    await this.mailService.sendVerificationEmail(
      user,
      link,
      tokenRecord.expiresAt,
    );
  }

  public async verifyEmail(token: string) {
    return await this.verfiyEmailProvider.verify(token);
  }
}
