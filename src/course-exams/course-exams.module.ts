import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Certificate } from 'src/certificates/certificate.entity';
import { Lecture } from 'src/lectures/lecture.entity';
import { Course } from 'src/courses/course.entity';
import { Enrollment } from 'src/enrollments/enrollment.entity';
import { UserProgres } from 'src/user-progress/user-progres.entity';
import { User } from 'src/users/user.entity';
import { CourseExamAccessOverride } from './course-exam-access-override.entity';
import { CourseExamAttempt } from './course-exam-attempt.entity';
import { CourseExamsController } from './course-exams.controller';
import { CourseExamsService } from './providers/course-exams.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Course,
      User,
      Enrollment,
      Lecture,
      UserProgres,
      Certificate,
      CourseExamAccessOverride,
      CourseExamAttempt,
    ]),
  ],
  controllers: [CourseExamsController],
  providers: [CourseExamsService],
  exports: [CourseExamsService, TypeOrmModule],
})
export class CourseExamsModule {}
