import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailerService } from '@nestjs-modules/mailer';
import { SendEmailJobData } from './interfaces/send-mail-options.interface';
import { Logger } from '@nestjs/common';

@Processor('mail')
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mailerService: MailerService) {
    super();
  }

  async process(job: Job<SendEmailJobData>): Promise<void> {
    this.logger.log(`📨 Processing job: ${job.name}`);
    try {
      if (job.name === 'send-email') {
        const { to, subject, html, attachments } = job.data;

        await this.mailerService.sendMail({
          to,
          subject,
          html,
          attachments,
        });

        this.logger.log(`✅ Email sent to ${to}`);
      }
    } catch (error) {
      this.logger.error(`❌ Email failed for ${job.data.to}`, error);
      throw error;
    }
  }
}
