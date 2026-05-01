import { DataSource } from 'typeorm';
import { EmailTemplate } from 'src/email-templates/email-template.entity';

const brandShell = ({
  eyebrow,
  title,
  content,
}: {
  eyebrow: string;
  title: string;
  content: string;
}) => `
  <div style="margin:0;padding:32px;background:#f5f7fb;font-family:Arial,sans-serif;color:#111827">
    <div style="max-width:640px;margin:auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="padding:34px;background:linear-gradient(135deg,#102048,#304fdb 55%,#e34b44);color:#fff">
        <p style="letter-spacing:5px;text-transform:uppercase;font-size:12px;margin:0 0 12px">${eyebrow}</p>
        <h1 style="font-size:30px;line-height:1.2;margin:0">${title}</h1>
      </div>
      <div style="padding:30px">
        ${content}
        <p style="font-size:12px;color:#94a3b8;margin-top:24px">{{year}} Unitus Health Academy</p>
      </div>
    </div>
  </div>
`;

const otpBlock = `
  <div style="margin:28px 0;padding:20px;border-radius:20px;background:#fff7ed;border:1px solid #fed7aa;text-align:center">
    <p style="margin:0 0 10px;font-size:12px;letter-spacing:4px;text-transform:uppercase;color:#9a3412">Verification code</p>
    <p style="margin:0;font-size:36px;font-weight:800;letter-spacing:8px;color:#111827">{{verificationCode}}</p>
  </div>
`;

const button = (label: string, href: string) =>
  `<a href="${href}" style="display:inline-block;background:#b91c1c;color:#fff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700">${label}</a>`;

const templates = [
  {
    templateName: 'registration_verification_otp',
    subject: 'Your Unitus account verification code',
    body: brandShell({
      eyebrow: 'Account verification',
      title: 'Hi {{name}}, confirm your email',
      content: `
        <p style="font-size:16px;line-height:1.7;color:#475569">Use this code to verify your Unitus account and complete your registration.</p>
        ${otpBlock}
        <p style="font-size:14px;color:#64748b">This code expires in {{expiryTime}}.</p>
      `,
    }),
  },
  {
    templateName: 'checkout_verification_otp',
    subject: 'Your Unitus checkout verification code',
    body: brandShell({
      eyebrow: 'Checkout verification',
      title: 'Hi {{name}}, confirm your email',
      content: `
        <p style="font-size:16px;line-height:1.7;color:#475569">Use this code at checkout to verify your email, create your Unitus account, and continue your purchase.</p>
        ${otpBlock}
        <p style="font-size:14px;color:#64748b">This code expires in {{expiryTime}}.</p>
      `,
    }),
  },
  {
    templateName: 'welcome_email',
    subject: 'Welcome to Unitus, {{name}}',
    body: brandShell({
      eyebrow: 'Account ready',
      title: 'Welcome to Unitus Health Academy',
      content: `
        <p style="font-size:16px;line-height:1.7;color:#475569">Your email <strong>{{email}}</strong> is now verified and your learner account is ready.</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:18px;margin:22px 0">
          <p style="margin:0;color:#475569">You can now access your dashboard, start enrolled courses, track progress, and download certificates as you complete programs.</p>
        </div>
        ${button('Go to dashboard', '{{dashboardUrl}}')}
      `,
    }),
  },
  {
    templateName: 'verification_email',
    subject: 'Complete your Unitus email verification',
    body: brandShell({
      eyebrow: 'Legacy verification',
      title: 'Confirm your email',
      content: `
        <p style="font-size:16px;line-height:1.7;color:#475569">If you requested email verification from an older Unitus flow, you can still use the secure button below.</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:18px;margin:22px 0">
          <p style="margin:0;color:#475569">This link expires in {{expiryTime}}.</p>
        </div>
        ${button('Verify email', '{{verificationUrl}}')}
      `,
    }),
  },
  {
    templateName: 'reset_password_email',
    subject: 'Reset your Unitus password',
    body: brandShell({
      eyebrow: 'Password reset',
      title: 'Reset your password',
      content: `
        <p style="font-size:16px;line-height:1.7;color:#475569">We received a request to reset the password for your Unitus account.</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:18px;margin:22px 0">
          <p style="margin:0;color:#475569">If this was you, continue securely using the button below. If not, you can safely ignore this email.</p>
        </div>
        ${button('Reset password', '{{resetLink}}')}
      `,
    }),
  },
  {
    templateName: 'password_reset_success',
    subject: 'Your Unitus password has been updated',
    body: brandShell({
      eyebrow: 'Password updated',
      title: 'Your password was changed successfully',
      content: `
        <p style="font-size:16px;line-height:1.7;color:#475569">Hi {{name}}, your Unitus password has been updated. You can now sign in with your new password.</p>
        ${button('Sign in now', '{{loginUrl}}')}
      `,
    }),
  },
  {
    templateName: 'course_certificate_issued',
    subject: 'Your Unitus certificate for {{courseTitle}} is ready',
    body: brandShell({
      eyebrow: 'Certificate unlocked',
      title: 'Congratulations, {{name}}!',
      content: `
        <p style="font-size:16px;line-height:1.7;color:#475569">You have successfully completed <strong>{{courseTitle}}</strong>. Your certificate is attached with this email and can also be downloaded from your Unitus profile.</p>
        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:18px;padding:18px;margin:24px 0">
          <p style="margin:0;color:#9a3412;font-size:13px">Certificate ID</p>
          <p style="margin:6px 0 0;font-size:20px;font-weight:700;color:#111827">{{certificateNumber}}</p>
        </div>
        ${button('Download certificate', '{{downloadUrl}}')}
        <p style="font-size:13px;color:#94a3b8;margin-top:24px">Issued on {{issuedDate}}</p>
      `,
    }),
  },
  {
    templateName: 'course_purchase_success',
    subject: 'Your Unitus course purchase is confirmed',
    body: brandShell({
      eyebrow: 'Purchase confirmed',
      title: 'Thank you, {{name}}.',
      content: `
        <p style="font-size:16px;line-height:1.7;color:#475569">Your Unitus order #{{orderId}} for {{courseCount}} course(s) has been successfully paid. Your invoice is attached with this email.</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:18px;margin:22px 0">{{coursesList}}</div>
        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:18px;padding:18px;margin:22px 0">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:4px;text-transform:uppercase;color:#9a3412">Invoice reference</p>
          <p style="margin:0;font-size:22px;font-weight:800;color:#111827">{{invoiceNumber}}</p>
        </div>
        {{invoiceSummary}}
        <div style="margin-top:24px">${button('Go to dashboard', '{{dashboardUrl}}')}</div>
      `,
    }),
  },
  {
    templateName: 'course_enrollment_success',
    subject: 'You are enrolled in {{courseTitle}}',
    body: brandShell({
      eyebrow: 'Enrollment active',
      title: 'Welcome to {{courseTitle}}',
      content: `
        <p style="font-size:16px;line-height:1.7;color:#475569">Hi {{name}}, your course access is now active. Start learning at your own pace and complete all lessons to unlock your certificate.</p>
        ${button('Start learning', '{{courseUrl}}')}
      `,
    }),
  },
  {
    templateName: 'course_payment_failed',
    subject: 'Payment failed for order #{{orderId}}',
    body: brandShell({
      eyebrow: 'Payment failed',
      title: 'Your payment could not be completed',
      content: `
        <p style="font-size:16px;line-height:1.7;color:#475569">Your Unitus payment for order #{{orderId}} did not go through. You can retry the payment using the button below.</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:18px;margin:22px 0">{{coursesList}}</div>
        <p style="font-size:18px;font-weight:700;color:#111827">Order total: {{amount}}</p>
        <div style="margin-top:24px">${button('Retry payment', '{{retryUrl}}')}</div>
      `,
    }),
  },
  {
    templateName: 'course_order_cancelled',
    subject: 'Order #{{orderId}} has been cancelled',
    body: brandShell({
      eyebrow: 'Order cancelled',
      title: 'Your order has been cancelled',
      content: `
        <p style="font-size:16px;line-height:1.7;color:#475569">Order #{{orderId}} was marked as cancelled. If you still want these courses, you can retry the payment from your account.</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:18px;margin:22px 0">{{coursesList}}</div>
        <p style="font-size:18px;font-weight:700;color:#111827">Order total: {{amount}}</p>
        <div style="margin-top:24px">${button('Retry payment', '{{retryUrl}}')}</div>
      `,
    }),
  },
  {
    templateName: 'course_payment_retry_ready',
    subject: 'Retry payment is ready for order #{{orderId}}',
    body: brandShell({
      eyebrow: 'Payment retry ready',
      title: 'Your retry payment link is ready',
      content: `
        <p style="font-size:16px;line-height:1.7;color:#475569">A fresh payment attempt has been created for order #{{orderId}}. Continue from your account to complete the payment securely.</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:18px;margin:22px 0">{{coursesList}}</div>
        <p style="font-size:18px;font-weight:700;color:#111827">Order total: {{amount}}</p>
        <div style="margin-top:24px">${button('Continue payment', '{{retryUrl}}')}</div>
      `,
    }),
  },
];

export async function seedEmailTemplates(dataSource: DataSource) {
  const emailTemplateRepository = dataSource.getRepository(EmailTemplate);

  for (const template of templates) {
    const existing = await emailTemplateRepository.findOne({
      where: { templateName: template.templateName },
      withDeleted: true,
    });

    if (existing) {
      if (existing.deletedAt) {
        await emailTemplateRepository.restore(existing.id);
      }
      await emailTemplateRepository.save({
        ...existing,
        ...template,
      });
      continue;
    }

    await emailTemplateRepository.save(
      emailTemplateRepository.create(template),
    );
  }
}
