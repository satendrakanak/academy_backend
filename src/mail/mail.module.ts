import { Global, Module } from '@nestjs/common';
import { MailService } from './providers/mail.service';
import { BullModule } from '@nestjs/bullmq';
import { MailProcessor } from './mail.processor';
import { SendWelcomeEmailProvider } from './providers/send-welcome-email.provider';
import { EmailTemplatesModule } from 'src/email-templates/email-templates.module';
import { SendVerificationEmailProvider } from './providers/send-verification-email.provider';
import { SendForgotPasswordEmailProvider } from './providers/send-forgot-password-email.provider';
import { SendResetPasswordEmailProvider } from './providers/send-reset-password-email.provider';
import { SendCheckoutOtpEmailProvider } from './providers/send-checkout-otp-email.provider';
import { SendRegistrationOtpEmailProvider } from './providers/send-registration-otp-email.provider';
import { SettingsModule } from 'src/settings/settings.module';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'mail',
    }),
    EmailTemplatesModule,
    SettingsModule,
  ],
  providers: [
    MailService,
    MailProcessor,
    SendWelcomeEmailProvider,
    SendVerificationEmailProvider,
    SendForgotPasswordEmailProvider,
    SendResetPasswordEmailProvider,
    SendCheckoutOtpEmailProvider,
    SendRegistrationOtpEmailProvider,
  ],
  exports: [MailService],
})
export class MailModule {}
