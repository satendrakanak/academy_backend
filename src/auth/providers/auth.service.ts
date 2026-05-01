import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { SignInDto } from '../dtos/sign-in.dto';
import { SignInProvider } from './sign-in.provider';
import { RefreshTokensProvider } from './refresh-tokens.provider';
import { SignupDto } from '../dtos/sign-up.dto';
import { UsersService } from 'src/users/providers/users.service';
import { VerifyEmailProvider } from './verify-email.provider';
import { User } from 'src/users/user.entity';
import { GenerateVerificationTokenProvider } from './generate-verification-token.provider';
import { TokenType } from '../enums/token-type.enum';
import { MailService } from 'src/mail/providers/mail.service';
import { ForgotPasswordProvider } from './forgot-password.provider';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { ResetPasswordProvider } from './reset-password.provider';

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
     * Inject forgotPasswordProvider
     */

    private readonly forgotPasswordProvider: ForgotPasswordProvider,

    /**
     * Inject resetPasswordProvider
     */

    private readonly resetPasswordProvider: ResetPasswordProvider,

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

  public async refreshTokens(refreshToken: string) {
    return await this.refreshTokensProvider.refreshTokens(refreshToken);
  }

  async sendVerificationEmail(user: User) {
    const tokenRecord = await this.generateVerificationTokenProvider.generate({
      userId: user.id,
      type: TokenType.EMAIL_VERIFICATION,
    });

    await this.mailService.sendVerificationEmail(
      user,
      tokenRecord.token,
      tokenRecord.expiresAt,
    );
  }

  async sendCheckoutVerificationOtp(user: User) {
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

  async forgotPassword(email: string) {
    return await this.forgotPasswordProvider.forgotPassword(email);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    return await this.resetPasswordProvider.resetPassword(resetPasswordDto);
  }

  public async verifyEmail(token: string) {
    return await this.verfiyEmailProvider.verify(token);
  }
}
