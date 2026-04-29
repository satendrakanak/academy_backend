import { forwardRef, Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './providers/courses.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from './course.entity';
import { CreateCourseProvider } from './providers/create-course.provider';
import { SlugModule } from 'src/common/slug/slug.module';
import { PaginationModule } from 'src/common/pagination/pagination.module';
import { UpdateCourseProvider } from './providers/update-course.provider';
import { UploadsModule } from 'src/uploads/uploads.module';
import { CategoriesModule } from 'src/categories/categories.module';
import { TagsModule } from 'src/tags/tags.module';
import { FindOneBySlugProvider } from './providers/find-one-by-slug.provider';
import { OrdersModule } from 'src/orders/orders.module';
import { EnrollmentsModule } from 'src/enrollments/enrollments.module';
import { UserProgressModule } from 'src/user-progress/user-progress.module';
import { GetFeaturedCoursesProvider } from './providers/get-featured-courses.provider';
import { GetRelatedCoursesProvider } from './providers/get-related-courses.provider';
import { GetEnrolledCoursesProvider } from './providers/get-enrolled-courses.provider';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Course]),
    SlugModule,
    PaginationModule,
    UploadsModule,
    CategoriesModule,
    TagsModule,
    UploadsModule,
    EnrollmentsModule,
    UserProgressModule,
    UsersModule,
    forwardRef(() => OrdersModule),
  ],
  controllers: [CoursesController],
  providers: [
    CoursesService,
    CreateCourseProvider,
    UpdateCourseProvider,
    FindOneBySlugProvider,
    GetFeaturedCoursesProvider,
    GetRelatedCoursesProvider,
    GetEnrolledCoursesProvider,
  ],
  exports: [CoursesService],
})
export class CoursesModule {}
