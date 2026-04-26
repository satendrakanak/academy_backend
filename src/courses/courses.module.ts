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
    forwardRef(() => OrdersModule),
  ],
  controllers: [CoursesController],
  providers: [
    CoursesService,
    CreateCourseProvider,
    UpdateCourseProvider,
    FindOneBySlugProvider,
  ],
  exports: [CoursesService],
})
export class CoursesModule {}
