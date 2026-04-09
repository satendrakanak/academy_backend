import { InjectQueue } from '@nestjs/bullmq';
import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { EmailTemplatesService } from 'src/email-templates/providers/email-templates.service';
import { User } from 'src/users/user.entity';
import { parseTemplate } from '../utils/template-parser';

@Injectable()
export class SendResetPasswordEmailProvider {
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
  async sendResetPasswordEmail(user: User): Promise<void> {
    const template = await this.emailTemplatesService.getByName(
      'password_reset_success',
    );
    if (!template) {
      throw new NotFoundException('Password reset email template not found');
    }
    const loginUrl = `${this.configService.get<string>('appConfig.fronEndUrl')}/auth/sign-in`;

    const subject = parseTemplate(template.subject, {
      name: user.firstName,
    });

    const html = parseTemplate(template.body, {
      name: user.firstName,
      loginUrl,
      year: new Date().getFullYear().toString(),
    });
    await this.mailQueue.add('send-email', {
      to: user.email,
      subject,
      html,
    });
  }
}
