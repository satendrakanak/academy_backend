import { DataSource } from 'typeorm';
import { EmailTemplate } from 'src/email-templates/email-template.entity';

const templates = [
  {
    templateName: 'course_certificate_issued',
    subject: 'Your Unitus certificate for {{courseTitle}} is ready',
    body: `
      <div style="margin:0;padding:32px;background:#f5f7fb;font-family:Arial,sans-serif;color:#111827">
        <div style="max-width:640px;margin:auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e5e7eb">
          <div style="padding:36px;background:linear-gradient(135deg,#102048,#304fdb 55%,#e34b44);color:#fff">
            <p style="letter-spacing:5px;text-transform:uppercase;font-size:12px;margin:0 0 12px">Certificate unlocked</p>
            <h1 style="font-size:32px;line-height:1.2;margin:0">Congratulations, {{name}}!</h1>
          </div>
          <div style="padding:32px">
            <p style="font-size:16px;line-height:1.7;color:#475569">You have successfully completed <strong>{{courseTitle}}</strong>. Your certificate is attached with this email and can also be downloaded from your Unitus profile.</p>
            <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:18px;padding:18px;margin:24px 0">
              <p style="margin:0;color:#9a3412;font-size:13px">Certificate ID</p>
              <p style="margin:6px 0 0;font-size:20px;font-weight:700;color:#111827">{{certificateNumber}}</p>
            </div>
            <a href="{{downloadUrl}}" style="display:inline-block;background:#b91c1c;color:#fff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700">Download Certificate</a>
            <p style="font-size:13px;color:#94a3b8;margin-top:24px">Issued on {{issuedDate}}</p>
          </div>
        </div>
      </div>
    `,
  },
];

export async function seedEmailTemplates(dataSource: DataSource) {
  const emailTemplateRepository = dataSource.getRepository(EmailTemplate);

  for (const template of templates) {
    const existing = await emailTemplateRepository.findOne({
      where: { templateName: template.templateName },
    });

    if (existing) {
      await emailTemplateRepository.update(existing.id, template);
      continue;
    }

    await emailTemplateRepository.save(
      emailTemplateRepository.create(template),
    );
  }
}
