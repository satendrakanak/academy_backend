import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from 'src/courses/course.entity';
import { Enrollment } from 'src/enrollments/enrollment.entity';
import { User } from 'src/users/user.entity';
import { CourseAnswer } from './course-answer.entity';
import { CourseQuestion } from './course-question.entity';
import { CourseQaController } from './course-qa.controller';
import { CourseQaService } from './providers/course-qa.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CourseQuestion,
      CourseAnswer,
      Course,
      User,
      Enrollment,
    ]),
  ],
  controllers: [CourseQaController],
  providers: [CourseQaService],
})
export class CourseQaModule {}
