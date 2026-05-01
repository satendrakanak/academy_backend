import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailTemplatesService } from 'src/email-templates/providers/email-templates.service';
import { MailService } from 'src/mail/providers/mail.service';
import { parseTemplate } from 'src/mail/utils/template-parser';
import { Enrollment } from 'src/enrollments/enrollment.entity';
import { Order } from 'src/orders/order.entity';
import { renderInvoicePdf } from 'src/certificates/providers/pdf-renderer.util';

const PURCHASE_TEMPLATE = 'course_purchase_success';
const ENROLLMENT_TEMPLATE = 'course_enrollment_success';
const PAYMENT_FAILED_TEMPLATE = 'course_payment_failed';
const ORDER_CANCELLED_TEMPLATE = 'course_order_cancelled';
const PAYMENT_RETRY_TEMPLATE = 'course_payment_retry_ready';

@Injectable()
export class OrderEmailProvider {
  private readonly logger = new Logger(OrderEmailProvider.name);

  constructor(
    private readonly mailService: MailService,
    private readonly emailTemplatesService: EmailTemplatesService,
    private readonly configService: ConfigService,
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

  async sendPaymentFailedEmail(order: Order) {
    const template = await this.getTemplate(PAYMENT_FAILED_TEMPLATE, {
      subject: 'Payment failed for order #{{orderId}}',
      body: this.defaultStatusTemplate({
        eyebrow: 'Payment failed',
        heading: 'Your payment could not be completed',
        description:
          'Your Unitus payment for order #{{orderId}} did not go through. You can retry the payment using the button below.',
        buttonLabel: 'Retry payment',
      }),
    });

    await this.sendStatusEmail(order, template.subject, template.body);
  }

  async sendOrderCancelledEmail(order: Order) {
    const template = await this.getTemplate(ORDER_CANCELLED_TEMPLATE, {
      subject: 'Order #{{orderId}} has been cancelled',
      body: this.defaultStatusTemplate({
        eyebrow: 'Order cancelled',
        heading: 'Your order has been cancelled',
        description:
          'Order #{{orderId}} was marked as cancelled. If you still want these courses, you can retry the payment from your account.',
        buttonLabel: 'Retry payment',
      }),
    });

    await this.sendStatusEmail(order, template.subject, template.body);
  }

  async sendRetryPaymentEmail(order: Order) {
    const template = await this.getTemplate(PAYMENT_RETRY_TEMPLATE, {
      subject: 'Retry payment is ready for order #{{orderId}}',
      body: this.defaultStatusTemplate({
        eyebrow: 'Payment retry ready',
        heading: 'Your retry payment link is ready',
        description:
          'A fresh payment attempt has been created for order #{{orderId}}. Continue from your account to complete the payment securely.',
        buttonLabel: 'Continue payment',
      }),
    });

    await this.sendStatusEmail(order, template.subject, template.body);
  }

  private async sendPurchaseEmail(order: Order) {
    const user = order.user;
    const coursesList = this.getCoursesListMarkup(order);
    const invoiceNumber = this.getInvoiceNumber(order);
    const variables = {
      ...this.getCommonVariables(order),
      coursesList,
      invoiceNumber,
      invoiceDate: this.formatDate(order.paidAt || order.updatedAt),
      invoiceSummary: this.getInvoiceSummaryMarkup(order),
      dashboardUrl: this.getDashboardUrl(),
      retryUrl: this.getRetryUrl(order),
    };
    const template = await this.getTemplate(PURCHASE_TEMPLATE, {
      subject: 'Your Unitus course purchase is confirmed',
      body: this.defaultPurchaseTemplate(),
    });

    await this.mailService.sendMail({
      to: user.email,
      subject: parseTemplate(template.subject, variables),
      html: parseTemplate(template.body, variables),
      attachments: [await this.buildInvoiceAttachment(order)],
    });
  }

  private async sendEnrollmentEmail(order: Order, enrollment: Enrollment) {
    const user = order.user;
    const course = enrollment.course;
    const courseUrl = `${this.getFrontendUrl()}/course/${course.slug}/learn`;
    const variables = {
      name: this.getUserName(order),
      courseTitle: course.title,
      courseUrl,
      orderId: String(order.id),
      year: new Date().getFullYear().toString(),
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

  private async sendStatusEmail(
    order: Order,
    subjectTemplate: string,
    bodyTemplate: string,
  ) {
    const variables = {
      ...this.getCommonVariables(order),
      coursesList: this.getCoursesListMarkup(order),
      retryUrl: this.getRetryUrl(order),
      dashboardUrl: this.getDashboardUrl(),
    };

    await this.mailService.sendMail({
      to: order.user.email,
      subject: parseTemplate(subjectTemplate, variables),
      html: parseTemplate(bodyTemplate, variables),
    });
  }

  private getCommonVariables(order: Order) {
    return {
      name: this.getUserName(order),
      orderId: String(order.id),
      amount: this.formatCurrency(order.totalAmount),
      subTotal: this.formatCurrency(order.subTotal),
      discount: this.formatCurrency(order.discount),
      tax: this.formatCurrency(order.tax),
      courseCount: String(order.items.length),
      billingName: `${order.billingAddress.firstName} ${order.billingAddress.lastName}`.trim(),
      billingEmail: order.billingAddress.email,
      billingPhone: order.billingAddress.phoneNumber,
      billingAddress: [
        order.billingAddress.address,
        order.billingAddress.city,
        order.billingAddress.state,
        order.billingAddress.country,
        order.billingAddress.pincode,
      ]
        .filter(Boolean)
        .join(', '),
      paymentMethod: order.paymentMethod || 'Online payment',
      year: new Date().getFullYear().toString(),
    };
  }

  private getUserName(order: Order) {
    return [order.user.firstName, order.user.lastName]
      .filter(Boolean)
      .join(' ')
      .trim() || [order.billingAddress.firstName, order.billingAddress.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  private getCoursesListMarkup(order: Order) {
    return `<ul style="margin:0;padding-left:18px;color:#334155">${order.items
      .map(
        (item) =>
          `<li style="margin-bottom:10px"><strong>${item.course.title}</strong> - ${this.formatCurrency(item.price)}</li>`,
      )
      .join('')}</ul>`;
  }

  private getInvoiceSummaryMarkup(order: Order) {
    return `
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tbody>
          <tr>
            <td style="padding:8px 0;color:#64748b">Subtotal</td>
            <td style="padding:8px 0;text-align:right;color:#111827">${this.formatCurrency(order.subTotal)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b">Discount</td>
            <td style="padding:8px 0;text-align:right;color:#111827">${this.formatCurrency(order.discount)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b">Tax</td>
            <td style="padding:8px 0;text-align:right;color:#111827">${this.formatCurrency(order.tax)}</td>
          </tr>
          <tr>
            <td style="padding:12px 0 0;font-weight:700;color:#111827">Total paid</td>
            <td style="padding:12px 0 0;text-align:right;font-weight:700;color:#111827">${this.formatCurrency(order.totalAmount)}</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  private async buildInvoiceAttachment(order: Order) {
    const pdfBuffer = await renderInvoicePdf(order);
    return {
      filename: `unitus-invoice-order-${order.id}.pdf`,
      content: pdfBuffer.toString('base64'),
      encoding: 'base64',
      contentType: 'application/pdf',
    };
  }

  private getInvoiceNumber(order: Order) {
    return `INV-${new Date(order.createdAt).getFullYear()}-${String(order.id).padStart(6, '0')}`;
  }

  private getRetryUrl(order: Order) {
    return `${this.getFrontendUrl()}/checkout?retryOrderId=${order.id}`;
  }

  private getDashboardUrl() {
    return `${this.getFrontendUrl()}/dashboard`;
  }

  private getFrontendUrl() {
    return this.configService.get<string>('appConfig.fronEndUrl') || 'http://localhost:3000';
  }

  private formatCurrency(value: number | string) {
    return `₹${Number(value).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  private formatDate(value: Date | string) {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
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
            <p style="font-size:16px;line-height:1.7;color:#475569">Your Unitus order #{{orderId}} for {{courseCount}} course(s) has been successfully paid. Your invoice is attached with this email.</p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:18px;margin:22px 0">{{coursesList}}</div>
            <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:18px;padding:18px;margin:22px 0">
              <p style="margin:0 0 8px;font-size:12px;letter-spacing:4px;text-transform:uppercase;color:#9a3412">Invoice reference</p>
              <p style="margin:0;font-size:22px;font-weight:800;color:#111827">{{invoiceNumber}}</p>
            </div>
            {{invoiceSummary}}
            <div style="margin-top:26px">
              <a href="{{dashboardUrl}}" style="display:inline-block;background:#b91c1c;color:#fff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700">Go to dashboard</a>
            </div>
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

  private defaultStatusTemplate({
    eyebrow,
    heading,
    description,
    buttonLabel,
  }: {
    eyebrow: string;
    heading: string;
    description: string;
    buttonLabel: string;
  }) {
    return `
      <div style="margin:0;padding:32px;background:#f5f7fb;font-family:Arial,sans-serif;color:#111827">
        <div style="max-width:640px;margin:auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e5e7eb">
          <div style="padding:34px;background:linear-gradient(135deg,#102048,#304fdb 55%,#e34b44);color:#fff">
            <p style="letter-spacing:5px;text-transform:uppercase;font-size:12px;margin:0 0 12px">${eyebrow}</p>
            <h1 style="font-size:30px;line-height:1.2;margin:0">${heading}</h1>
          </div>
          <div style="padding:30px">
            <p style="font-size:16px;line-height:1.7;color:#475569">${description}</p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:18px;margin:22px 0">{{coursesList}}</div>
            <p style="font-size:18px;font-weight:700;color:#111827">Order total: {{amount}}</p>
            <div style="margin-top:26px">
              <a href="{{retryUrl}}" style="display:inline-block;background:#b91c1c;color:#fff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700">${buttonLabel}</a>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
