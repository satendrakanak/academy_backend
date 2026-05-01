import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from 'src/courses/course.entity';
import { Enrollment } from 'src/enrollments/enrollment.entity';
import { User } from 'src/users/user.entity';
import { CourseReview } from './course-review.entity';
import { CourseReviewsController } from './course-reviews.controller';
import { CourseReviewsService } from './providers/course-reviews.service';

@Module({
  imports: [TypeOrmModule.forFeature([CourseReview, Course, User, Enrollment])],
  controllers: [CourseReviewsController],
  providers: [CourseReviewsService],
})
export class CourseReviewsModule {}
