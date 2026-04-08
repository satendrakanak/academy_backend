import { Injectable, Logger } from '@nestjs/common';
import { SendEmailJobData } from '../interfaces/send-mail-options.interface';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { User } from 'src/users/user.entity';
import { SendWelcomeEmailProvider } from './send-welcome-email.provider';
import { SendVerificationEmailProvider } from './send-verification-email.provider';

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
    link: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.sendVerificationEmailProvider.sendVerificationEmail(
      user,
      link,
      expiresAt,
    );
  }
}
