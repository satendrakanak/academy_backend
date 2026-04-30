import { Global, Module } from '@nestjs/common';
import { MailService } from './providers/mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { MailProcessor } from './mail.processor';
import { SendWelcomeEmailProvider } from './providers/send-welcome-email.provider';
import { EmailTemplatesModule } from 'src/email-templates/email-templates.module';
import { SendVerificationEmailProvider } from './providers/send-verification-email.provider';
import { SendForgotPasswordEmailProvider } from './providers/send-forgot-password-email.provider';
import { SendResetPasswordEmailProvider } from './providers/send-reset-password-email.provider';
import { SendCheckoutOtpEmailProvider } from './providers/send-checkout-otp-email.provider';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        return {
          transport: {
            host: config.get<string>('appConfig.smtpHost'),
            port: Number(config.get<number>('appConfig.smtpPort')),
            secure:
              config.get<string>('appConfig.smtpMailEncryption') === 'true',
            auth: {
              user: config.get<string>('appConfig.smtpUser'),
              pass: config.get<string>('appConfig.smtpPassword'),
            },
          },
          defaults: {
            from: `${config.get<string>(
              'appConfig.smtpFromName',
            )} <${config.get<string>('appConfig.smtpFromEmail')}>`,
          },
        };
      },
    }),
    BullModule.registerQueue({
      name: 'mail',
    }),
    EmailTemplatesModule,
  ],
  providers: [
    MailService,
    MailProcessor,
    SendWelcomeEmailProvider,
    SendVerificationEmailProvider,
    SendForgotPasswordEmailProvider,
    SendResetPasswordEmailProvider,
    SendCheckoutOtpEmailProvider,
  ],
  exports: [MailService],
})
export class MailModule {}
