import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chapter } from 'src/chapters/chapter.entity';
import { Course } from 'src/courses/course.entity';
import { EmailTemplatesModule } from 'src/email-templates/email-templates.module';
import { Lecture } from 'src/lectures/lecture.entity';
import { MailModule } from 'src/mail/mail.module';
import { UploadsModule } from 'src/uploads/uploads.module';
import { Upload } from 'src/uploads/upload.entity';
import { UserProgres } from 'src/user-progress/user-progres.entity';
import { User } from 'src/users/user.entity';
import { Certificate } from './certificate.entity';
import { CourseExamsModule } from 'src/course-exams/course-exams.module';
import { CertificatesController } from './certificates.controller';
import { CertificateTemplateProvider } from './providers/certificate-template.provider';
import { CertificatesService } from './providers/certificates.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Certificate,
      User,
      Course,
      Chapter,
      Lecture,
      UserProgres,
      Upload,
    ]),
    UploadsModule,
    MailModule,
    EmailTemplatesModule,
    CourseExamsModule,
  ],
  controllers: [CertificatesController],
  providers: [CertificatesService, CertificateTemplateProvider],
  exports: [CertificatesService],
})
export class CertificatesModule {}
