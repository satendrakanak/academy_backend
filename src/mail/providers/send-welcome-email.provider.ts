import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmailTemplatesService } from 'src/email-templates/providers/email-templates.service';
import { User } from 'src/users/user.entity';
import { parseTemplate } from '../utils/template-parser';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SendWelcomeEmailProvider {
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

  async sendWelcomeEmail(user: User): Promise<void> {
    const template =
      await this.emailTemplatesService.getByName('welcome_email');
    if (!template) {
      throw new NotFoundException('Welcome email template not found');
    }

    const subject = parseTemplate(template.subject, {
      name: user.firstName,
    });

    const html = parseTemplate(template.body, {
      name: user.firstName,
      email: user.email,
      dashboardUrl: `${this.configService.get<string>('appConfig.fronEndUrl')}/admin/dashboard`,
      year: new Date().getFullYear().toString(),
    });
    await this.mailQueue.add('send-email', {
      to: user.email,
      subject,
      html,
    });
  }
}
