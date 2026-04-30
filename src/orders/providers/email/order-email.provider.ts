import { Injectable, Logger } from '@nestjs/common';
import { EmailTemplatesService } from 'src/email-templates/providers/email-templates.service';
import { MailService } from 'src/mail/providers/mail.service';
import { parseTemplate } from 'src/mail/utils/template-parser';
import { Enrollment } from 'src/enrollments/enrollment.entity';
import { Order } from 'src/orders/order.entity';

const PURCHASE_TEMPLATE = 'course_purchase_success';
const ENROLLMENT_TEMPLATE = 'course_enrollment_success';

@Injectable()
export class OrderEmailProvider {
  private readonly logger = new Logger(OrderEmailProvider.name);

  constructor(
    private readonly mailService: MailService,
    private readonly emailTemplatesService: EmailTemplatesService,
  ) {}

  async sendPurchaseAndEnrollmentEmails(
    order: Order,
    enrollments: Enrollment[],
  ) {
    await this.sendPurchaseEmail(order).catch((error) =>
      this.logger.error(`Purchase email failed for order ${order.id}`, error),
    );

    await Promise.all(
      enrollments.map((enrollment) =>
        this.sendEnrollmentEmail(order, enrollment).catch((error) =>
          this.logger.error(
            `Enrollment email failed for order ${order.id}`,
            error,
          ),
        ),
      ),
    );
  }

  private async sendPurchaseEmail(order: Order) {
    const user = order.user;
    const coursesList = order.items
      .map((item) => `<li>${item.course.title}</li>`)
      .join('');
    const variables = {
      name: [user.firstName, user.lastName].filter(Boolean).join(' '),
      orderId: String(order.id),
      amount: `₹${Number(order.totalAmount).toLocaleString('en-IN')}`,
      coursesList: `<ul>${coursesList}</ul>`,
      courseCount: String(order.items.length),
    };
    const template = await this.getTemplate(PURCHASE_TEMPLATE, {
      subject: 'Your Unitus course purchase is confirmed',
      body: this.defaultPurchaseTemplate(),
    });

    await this.mailService.sendMail({
      to: user.email,
      subject: parseTemplate(template.subject, variables),
      html: parseTemplate(template.body, variables),
    });
  }

  private async sendEnrollmentEmail(order: Order, enrollment: Enrollment) {
    const user = order.user;
    const course = enrollment.course;
    const courseUrl = `http://localhost:3000/course/${course.slug}/learn`;
    const variables = {
      name: [user.firstName, user.lastName].filter(Boolean).join(' '),
      courseTitle: course.title,
      courseUrl,
      orderId: String(order.id),
    };
    const template = await this.getTemplate(ENROLLMENT_TEMPLATE, {
      subject: 'You are enrolled in {{courseTitle}}',
      body: this.defaultEnrollmentTemplate(),
    });

    await this.mailService.sendMail({
      to: user.email,
      subject: parseTemplate(template.subject, variables),
      html: parseTemplate(template.body, variables),
    });
  }

  private async getTemplate(
    name: string,
    fallback: { subject: string; body: string },
  ) {
    try {
      return await this.emailTemplatesService.getByName(name);
    } catch {
      return fallback;
    }
  }

  private defaultPurchaseTemplate() {
    return `
      <div style="margin:0;padding:32px;background:#f5f7fb;font-family:Arial,sans-serif;color:#111827">
        <div style="max-width:640px;margin:auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e5e7eb">
          <div style="padding:34px;background:linear-gradient(135deg,#102048,#304fdb 55%,#e34b44);color:#fff">
            <p style="letter-spacing:5px;text-transform:uppercase;font-size:12px;margin:0 0 12px">Purchase confirmed</p>
            <h1 style="font-size:30px;line-height:1.2;margin:0">Thank you, {{name}}.</h1>
          </div>
          <div style="padding:30px">
            <p style="font-size:16px;line-height:1.7;color:#475569">Your Unitus order #{{orderId}} for {{courseCount}} course(s) has been successfully paid.</p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:18px;margin:22px 0">{{coursesList}}</div>
            <p style="font-size:18px;font-weight:700;color:#111827">Total paid: {{amount}}</p>
          </div>
        </div>
      </div>
    `;
  }

  private defaultEnrollmentTemplate() {
    return `
      <div style="margin:0;padding:32px;background:#f5f7fb;font-family:Arial,sans-serif;color:#111827">
        <div style="max-width:640px;margin:auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e5e7eb">
          <div style="padding:34px;background:linear-gradient(135deg,#102048,#304fdb 55%,#e34b44);color:#fff">
            <p style="letter-spacing:5px;text-transform:uppercase;font-size:12px;margin:0 0 12px">Enrollment active</p>
            <h1 style="font-size:30px;line-height:1.2;margin:0">Welcome to {{courseTitle}}</h1>
          </div>
          <div style="padding:30px">
            <p style="font-size:16px;line-height:1.7;color:#475569">Hi {{name}}, your course access is now active. Start learning at your own pace and complete all lessons to unlock your certificate.</p>
            <a href="{{courseUrl}}" style="display:inline-block;background:#b91c1c;color:#fff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700">Start Learning</a>
          </div>
        </div>
      </div>
    `;
  }
}
