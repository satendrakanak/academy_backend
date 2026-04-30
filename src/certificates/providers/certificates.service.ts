import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { Chapter } from 'src/chapters/chapter.entity';
import { Course } from 'src/courses/course.entity';
import { EmailTemplatesService } from 'src/email-templates/providers/email-templates.service';
import { Lecture } from 'src/lectures/lecture.entity';
import { MailService } from 'src/mail/providers/mail.service';
import { parseTemplate } from 'src/mail/utils/template-parser';
import { MediaFileMappingService } from 'src/common/media-file-mapping/providers/media-file-mapping.service';
import { S3Provider } from 'src/uploads/providers/s3.provider';
import { Upload } from 'src/uploads/upload.entity';
import { FileTypes } from 'src/uploads/enums/file-types.enum';
import { UploadStatus } from 'src/uploads/enums/upload-status.enum';
import { UserProgres } from 'src/user-progress/user-progres.entity';
import { User } from 'src/users/user.entity';
import { Certificate } from '../certificate.entity';
import { CertificateResponse } from '../interfaces/certificate-response.interface';
import { CertificateTemplateProvider } from './certificate-template.provider';

const CERTIFICATE_EMAIL_TEMPLATE = 'course_certificate_issued';

@Injectable()
export class CertificatesService {
  private readonly logger = new Logger(CertificatesService.name);

  constructor(
    @InjectRepository(Certificate)
    private readonly certificateRepository: Repository<Certificate>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,

    @InjectRepository(Lecture)
    private readonly lectureRepository: Repository<Lecture>,

    @InjectRepository(UserProgres)
    private readonly userProgressRepository: Repository<UserProgres>,

    @InjectRepository(Upload)
    private readonly uploadRepository: Repository<Upload>,

    private readonly s3Provider: S3Provider,
    private readonly mediaFileMappingService: MediaFileMappingService,
    private readonly mailService: MailService,
    private readonly emailTemplatesService: EmailTemplatesService,
    private readonly certificateTemplateProvider: CertificateTemplateProvider,
  ) {}

  async findMine(userId: number): Promise<CertificateResponse[]> {
    const certificates = await this.certificateRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'course', 'file'],
      order: { issuedAt: 'DESC' },
    });

    return certificates.map((certificate) => this.toResponse(certificate));
  }

  async findForCourse(
    userId: number,
    courseId: number,
  ): Promise<CertificateResponse | null> {
    const certificate = await this.certificateRepository.findOne({
      where: {
        user: { id: userId },
        course: { id: courseId },
      },
      relations: ['user', 'course', 'file'],
    });

    return certificate ? this.toResponse(certificate) : null;
  }

  async generateForCourse(
    userId: number,
    courseId: number,
  ): Promise<CertificateResponse> {
    const certificate = await this.ensureCertificateForCourse(
      userId,
      courseId,
      {
        throwIfIncomplete: true,
        sendEmail: true,
      },
    );

    if (!certificate) {
      throw new BadRequestException(
        'Complete the course to unlock certificate',
      );
    }

    return this.toResponse(certificate);
  }

  async ensureCertificateForCourse(
    userId: number,
    courseId: number,
    options: { throwIfIncomplete?: boolean; sendEmail?: boolean } = {},
  ): Promise<Certificate | null> {
    const existing = await this.certificateRepository.findOne({
      where: { user: { id: userId }, course: { id: courseId } },
      relations: ['user', 'course', 'file'],
    });

    if (existing) {
      if (options.sendEmail && !existing.emailedAt) {
        await this.sendCertificateEmail(existing);
      }

      return existing;
    }

    const [user, course] = await Promise.all([
      this.userRepository.findOne({
        where: { id: userId },
        relations: ['avatar'],
      }),
      this.courseRepository.findOne({
        where: { id: courseId },
      }),
    ]);

    if (!user) throw new NotFoundException('User not found');
    if (!course) throw new NotFoundException('Course not found');

    const completion = await this.getCourseCompletion(userId, courseId);

    if (!completion.isCompleted) {
      if (options.throwIfIncomplete) {
        throw new BadRequestException(
          'Complete the course to unlock certificate',
        );
      }

      return null;
    }

    const issuedAt = new Date();
    const certificateNumber = await this.createCertificateNumber(courseId);
    const avatarUrl = user.avatar
      ? this.mediaFileMappingService.mapFile(user.avatar).path
      : null;

    const svg = this.certificateTemplateProvider.renderSvg({
      user,
      course,
      certificateNumber,
      issuedAt,
      avatarUrl,
    });
    const file = await this.uploadCertificate(svg, {
      userId,
      courseId,
      certificateNumber,
    });

    const certificate = await this.certificateRepository.save(
      this.certificateRepository.create({
        user,
        course,
        file,
        certificateNumber,
        issuedAt,
      }),
    );

    if (options.sendEmail !== false) {
      await this.sendCertificateEmail(certificate, Buffer.from(svg, 'utf8'));
    }

    return certificate;
  }

  async getCourseCompletion(userId: number, courseId: number) {
    const totalLectures = await this.lectureRepository.count({
      where: {
        isPublished: true,
        chapter: {
          course: { id: courseId },
        },
      },
      relations: ['chapter', 'chapter.course'],
    });

    if (!totalLectures) {
      return {
        totalLectures: 0,
        completedLectures: 0,
        progress: 0,
        isCompleted: false,
      };
    }

    const completedLectures = await this.userProgressRepository
      .createQueryBuilder('progress')
      .innerJoin('progress.lecture', 'lecture')
      .innerJoin('lecture.chapter', 'chapter')
      .where('progress.userId = :userId', { userId })
      .andWhere('chapter.courseId = :courseId', { courseId })
      .andWhere('progress.isCompleted = true')
      .andWhere('lecture.isPublished = true')
      .getCount();

    const progress = Math.min(
      100,
      Math.round((completedLectures / totalLectures) * 100),
    );

    return {
      totalLectures,
      completedLectures,
      progress,
      isCompleted: completedLectures >= totalLectures,
    };
  }

  async ensureFromLecture(userId: number, lectureId: number) {
    const lecture = await this.lectureRepository.findOne({
      where: { id: lectureId },
      relations: ['chapter', 'chapter.course'],
    });

    if (!lecture?.chapter?.course?.id) return null;

    return this.ensureCertificateForCourse(userId, lecture.chapter.course.id);
  }

  private async uploadCertificate(
    svg: string,
    params: { userId: number; courseId: number; certificateNumber: string },
  ): Promise<Upload> {
    const key = `certificates/course-${params.courseId}/user-${params.userId}/${params.certificateNumber}.svg`;
    const body = Buffer.from(svg, 'utf8');

    await this.s3Provider.getClient().send(
      new PutObjectCommand({
        Bucket: this.s3Provider.getBucket(),
        Key: key,
        Body: body,
        ContentType: 'image/svg+xml',
      }),
    );

    return this.uploadRepository.save(
      this.uploadRepository.create({
        name: `${params.certificateNumber}.svg`,
        path: key,
        type: FileTypes.IMAGE,
        mime: 'image/svg+xml',
        size: body.length,
        status: UploadStatus.COMPLETED,
      }),
    );
  }

  private async sendCertificateEmail(
    certificate: Certificate,
    attachment?: Buffer,
  ) {
    try {
      const user = certificate.user;
      const course = certificate.course;
      const file = certificate.file;
      const downloadUrl = file
        ? this.mediaFileMappingService.mapFile(file).path
        : '';
      const template = await this.getEmailTemplate();
      const variables = {
        name: [user.firstName, user.lastName].filter(Boolean).join(' '),
        courseTitle: course.title,
        certificateNumber: certificate.certificateNumber,
        issuedDate: certificate.issuedAt.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }),
        downloadUrl,
      };

      const mailAttachment = attachment
        ? {
            filename: `${certificate.certificateNumber}.svg`,
            content: attachment.toString('base64'),
            encoding: 'base64',
            contentType: 'image/svg+xml',
          }
        : {
            filename: `${certificate.certificateNumber}.svg`,
            path: downloadUrl,
            contentType: 'image/svg+xml',
          };

      await this.mailService.sendMail({
        to: user.email,
        subject: parseTemplate(template.subject, variables),
        html: parseTemplate(template.body, variables),
        attachments: [mailAttachment],
      });

      certificate.emailedAt = new Date();
      await this.certificateRepository.save(certificate);
    } catch (error) {
      this.logger.error(
        `Failed to send certificate email ${certificate.certificateNumber}`,
        error,
      );
    }
  }

  private async getEmailTemplate() {
    try {
      return await this.emailTemplatesService.getByName(
        CERTIFICATE_EMAIL_TEMPLATE,
      );
    } catch {
      return {
        subject: 'Your Unitus certificate for {{courseTitle}} is ready',
        body: this.defaultEmailTemplate(),
      };
    }
  }

  private defaultEmailTemplate() {
    return `
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
    `;
  }

  private async createCertificateNumber(courseId: number) {
    const suffix = randomUUID().split('-')[0].toUpperCase();
    return `UNITUS-${courseId}-${new Date().getFullYear()}-${suffix}`;
  }

  private toResponse(certificate: Certificate): CertificateResponse {
    return {
      id: certificate.id,
      certificateNumber: certificate.certificateNumber,
      issuedAt: certificate.issuedAt,
      emailedAt: certificate.emailedAt,
      file: certificate.file
        ? this.mediaFileMappingService.mapFile(certificate.file)
        : null,
      course: {
        id: certificate.course.id,
        title: certificate.course.title,
        slug: certificate.course.slug,
      },
      user: {
        id: certificate.user.id,
        firstName: certificate.user.firstName,
        lastName: certificate.user.lastName,
        email: certificate.user.email,
      },
    };
  }
}
