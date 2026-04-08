import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './providers/courses.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from './course.entity';
import { CreateCourseProvider } from './providers/create-course.provider';
import { SlugModule } from 'src/common/slug/slug.module';

@Module({
  imports: [TypeOrmModule.forFeature([Course]), SlugModule],
  controllers: [CoursesController],
  providers: [CoursesService, CreateCourseProvider],
})
export class CoursesModule {}
