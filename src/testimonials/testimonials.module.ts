import { Module } from '@nestjs/common';
import { TestimonialsController } from './testimonials.controller';
import { TestimonialsService } from './providers/testimonials.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Testimonial } from './testimonial.entity';
import { UpdateTestimonialProvider } from './providers/update-testimonial.provider';
import { UploadsModule } from 'src/uploads/uploads.module';
import { CoursesModule } from 'src/courses/courses.module';
import { PaginationModule } from 'src/common/pagination/pagination.module';
import { MediaFileMappingModule } from 'src/common/media-file-mapping/media-file-mapping.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Testimonial]),
    UploadsModule,
    CoursesModule,
    PaginationModule,
    MediaFileMappingModule,
  ],
  controllers: [TestimonialsController],
  providers: [TestimonialsService, UpdateTestimonialProvider],
})
export class TestimonialsModule {}
