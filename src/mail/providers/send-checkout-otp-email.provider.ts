import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { EmailTemplatesService } from 'src/email-templates/providers/email-templates.service';
import { User } from 'src/users/user.entity';
import { parseTemplate } from '../utils/template-parser';

@Injectable()
export class SendCheckoutOtpEmailProvider {
  constructor(
    private readonly emailTemplatesService: EmailTemplatesService,
    @InjectQueue('mail')
    private readonly mailQueue: Queue,
  ) {}

  async sendCheckoutOtpEmail(
    user: User,
    code: string,
    expiresAt: Date,
  ): Promise<void> {
    const diffMs = expiresAt.getTime() - Date.now();
    const expiryTime = `${Math.max(1, Math.floor(diffMs / 1000 / 60))} minutes`;

    let subject = 'Verify your Unitus checkout';
    let html = `
      <div style="margin:0;padding:32px;background:#f5f7fb;font-family:Arial,sans-serif;color:#111827">
        <div style="max-width:640px;margin:auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e5e7eb">
          <div style="padding:34px;background:linear-gradient(135deg,#102048,#304fdb 55%,#e34b44);color:#fff">
            <p style="letter-spacing:5px;text-transform:uppercase;font-size:12px;margin:0 0 12px">Checkout verification</p>
            <h1 style="font-size:30px;line-height:1.2;margin:0">Confirm your email to continue</h1>
          </div>
          <div style="padding:30px">
            <p style="font-size:16px;line-height:1.7;color:#475569">Hi ${user.firstName}, enter this verification code at checkout to create your account and continue your course purchase.</p>
            <div style="margin:28px 0;padding:20px;border-radius:20px;background:#fff7ed;border:1px solid #fed7aa;text-align:center">
              <p style="margin:0 0 10px;font-size:12px;letter-spacing:4px;text-transform:uppercase;color:#9a3412">Verification code</p>
              <p style="margin:0;font-size:36px;font-weight:800;letter-spacing:8px;color:#111827">${code}</p>
            </div>
            <p style="font-size:14px;color:#64748b">This code expires in ${expiryTime}.</p>
          </div>
        </div>
      </div>
    `;

    try {
      const template = await this.emailTemplatesService.getByName(
        'checkout_verification_otp',
      );

      subject = parseTemplate(template.subject, {
        name: user.firstName,
      });

      html = parseTemplate(template.body, {
        name: user.firstName,
        verificationCode: code,
        expiryTime,
        year: new Date().getFullYear().toString(),
      });
    } catch {
      // Fallback is intentional so checkout does not break if seed is pending.
    }

    await this.mailQueue.add('send-email', {
      to: user.email,
      subject,
      html,
    });
  }
}
