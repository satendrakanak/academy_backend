import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SendEmailJobData } from './interfaces/send-mail-options.interface';
import { Logger } from '@nestjs/common';
import { SettingsService } from 'src/settings/providers/settings.service';
import nodemailer from 'nodemailer';

@Processor('mail')
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly settingsService: SettingsService) {
    super();
  }

  async process(job: Job<SendEmailJobData>): Promise<void> {
    this.logger.log(`📨 Processing job: ${job.name}`);
    try {
      if (job.name === 'send-email') {
        const { to, subject, html, attachments } = job.data;
        const emailSettings =
          await this.settingsService.getEmailSettingsForSending();

        if (
          !emailSettings.isEnabled ||
          !emailSettings.smtpHost ||
          !emailSettings.smtpUser ||
          !emailSettings.smtpPassword
        ) {
          throw new Error('Email settings are not configured or disabled.');
        }

        const transporter = nodemailer.createTransport({
          host: emailSettings.smtpHost,
          port: Number(emailSettings.smtpPort || 587),
          secure: Boolean(emailSettings.secure),
          auth: {
            user: emailSettings.smtpUser?.trim(),
            pass: emailSettings.smtpPassword?.trim(),
          },
        });

        await transporter.sendMail({
          to,
          subject,
          html,
          attachments,
          from: `${emailSettings.fromName} <${emailSettings.fromEmail}>`,
          replyTo: emailSettings.replyToEmail || undefined,
        });

        this.logger.log(`✅ Email sent to ${to}`);
      }
    } catch (error) {
      this.logger.error(`❌ Email failed for ${job.data.to}`, error);
      throw error;
    }
  }
}
