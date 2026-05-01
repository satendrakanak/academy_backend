import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from 'src/courses/course.entity';
import { Enrollment } from 'src/enrollments/enrollment.entity';
import { User } from 'src/users/user.entity';
import { CourseExamAttempt } from './course-exam-attempt.entity';
import { CourseExamsController } from './course-exams.controller';
import { CourseExamsService } from './providers/course-exams.service';

@Module({
  imports: [TypeOrmModule.forFeature([Course, User, Enrollment, CourseExamAttempt])],
  controllers: [CourseExamsController],
  providers: [CourseExamsService],
  exports: [CourseExamsService, TypeOrmModule],
})
export class CourseExamsModule {}
