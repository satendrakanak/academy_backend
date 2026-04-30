import { Injectable, Logger } from '@nestjs/common';
import { SendEmailJobData } from '../interfaces/send-mail-options.interface';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { User } from 'src/users/user.entity';
import { SendWelcomeEmailProvider } from './send-welcome-email.provider';
import { SendVerificationEmailProvider } from './send-verification-email.provider';
import { SendForgotPasswordEmailProvider } from './send-forgot-password-email.provider';
import { SendResetPasswordEmailProvider } from './send-reset-password-email.provider';
import { SendCheckoutOtpEmailProvider } from './send-checkout-otp-email.provider';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    /**
     * Inject mailQueue
     */

    @InjectQueue('mail')
    private readonly mailQueue: Queue,

    /**
     * Inject sendWelcomeEmailProvider
     */
    private readonly sendWelcomeEmailProvider: SendWelcomeEmailProvider,

    /**
     * Inject sendVerificationEmailProvider
     */

    private readonly sendVerificationEmailProvider: SendVerificationEmailProvider,
    /**
     * Inject sendForgotPasswordEmailProvider
     */
    private readonly sendForgotPasswordEmailProvider: SendForgotPasswordEmailProvider,

    /**
     * Inject sendResetPasswordEmailProvider
     */
    private readonly sendResetPasswordEmailProvider: SendResetPasswordEmailProvider,
    private readonly sendCheckoutOtpEmailProvider: SendCheckoutOtpEmailProvider,
  ) {}

  async sendMail(data: SendEmailJobData): Promise<void> {
    try {
      await this.mailQueue.add('send-email', data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      });

      this.logger.log(`📥 Job added for ${data.to}`);
    } catch (error) {
      this.logger.error('❌ Failed to add job to queue', error);
      throw error; // important
    }
  }

  async sendWelcomeEmail(user: User): Promise<void> {
    await this.sendWelcomeEmailProvider.sendWelcomeEmail(user);
  }
  async sendVerificationEmail(
    user: User,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.sendVerificationEmailProvider.sendVerificationEmail(
      user,
      token,
      expiresAt,
    );
  }
  async sendForgotPasswordEmail(user: User, token: string): Promise<void> {
    await this.sendForgotPasswordEmailProvider.sendForgotPasswordEmail(
      user,
      token,
    );
  }
  async sendResetPasswordEmail(user: User): Promise<void> {
    await this.sendResetPasswordEmailProvider.sendResetPasswordEmail(user);
  }

  async sendCheckoutOtpEmail(
    user: User,
    code: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.sendCheckoutOtpEmailProvider.sendCheckoutOtpEmail(
      user,
      code,
      expiresAt,
    );
  }
}
