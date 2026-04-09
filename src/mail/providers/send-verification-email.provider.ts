import { InjectQueue } from '@nestjs/bullmq';
import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { EmailTemplatesService } from 'src/email-templates/providers/email-templates.service';
import { User } from 'src/users/user.entity';
import { parseTemplate } from '../utils/template-parser';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SendVerificationEmailProvider {
  constructor(
    /**
     * Inject templateService
     */
    @Inject(forwardRef(() => EmailTemplatesService))
    private readonly emailTemplatesService: EmailTemplatesService,
    /**
     * Inject mailQueue
     */

    @InjectQueue('mail')
    private readonly mailQueue: Queue,
    /**
     * Inject configService
     */

    private readonly configService: ConfigService,
  ) {}
  async sendVerificationEmail(
    user: User,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    const template =
      await this.emailTemplatesService.getByName('verification_email');
    if (!template) {
      throw new NotFoundException('Verification email template not found');
    }
    const link = `${this.configService.get<string>('appConfig.fronEndUrl')}/auth/verify-email?token=${token}`;
    const diffMs = expiresAt.getTime() - Date.now();
    const minutes = Math.floor(diffMs / 1000 / 60);

    const expiryTime = `${minutes} minutes`;

    const subject = parseTemplate(template.subject, {
      name: user.firstName,
    });

    const html = parseTemplate(template.body, {
      name: user.firstName,
      verificationUrl: link,
      expiryTime,
      year: new Date().getFullYear().toString(),
    });
    await this.mailQueue.add('send-email', {
      to: user.email,
      subject,
      html,
    });
  }
}
