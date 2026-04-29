import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Testimonial } from '../testimonial.entity';
import { Repository } from 'typeorm';
import { UpdateTestimonialDto } from '../dtos/update-testimonial.dto';
import { UploadsService } from 'src/uploads/providers/uploads.service';
import { CoursesService } from 'src/courses/providers/courses.service';
import { TestimonialType } from '../enums/testimonial-type.enum';

@Injectable()
export class UpdateTestimonialProvider {
  constructor(
    /**
     * Inject testimonialRepository
     */
    @InjectRepository(Testimonial)
    private readonly testimonialRepository: Repository<Testimonial>,

    /**
     * Inject uploadsService
     */

    private readonly uploadsService: UploadsService,

    /**
     * Inject coursesService
     */

    private readonly coursesService: CoursesService,
  ) {}

  async update(
    id: string,
    updateTestimonialDto: UpdateTestimonialDto,
  ): Promise<Testimonial> {
    const testimonial = await this.testimonialRepository.findOne({
      where: { id },
      relations: ['avatar', 'video', 'course'],
    });

    if (!testimonial) {
      throw new NotFoundException('Testimonial not found');
    }

    /**
     * 🧠 1. TYPE CHANGE HANDLE (TEXT ↔ VIDEO)
     */
    const finalType = updateTestimonialDto.type ?? testimonial.type;

    if (finalType === TestimonialType.VIDEO) {
      if (!updateTestimonialDto.videoId && !testimonial.video) {
        throw new BadRequestException(
          'videoId is required for video testimonial',
        );
      }

      testimonial.message = undefined;
    }

    if (finalType === TestimonialType.TEXT) {
      if (!updateTestimonialDto.message && !testimonial.message) {
        throw new BadRequestException(
          'message is required for text testimonial',
        );
      }

      testimonial.video = null;
    }

    testimonial.type = finalType;

    /**
     * 🖼 2. IMAGE HANDLE (Upload relation)
     */
    if (updateTestimonialDto.avatarId !== undefined) {
      if (!updateTestimonialDto.avatarId) {
        testimonial.avatar = null;
      } else {
        const image = await this.uploadsService.getOneById(
          updateTestimonialDto.avatarId,
        );

        if (!image) {
          throw new BadRequestException('Invalid imageId');
        }

        testimonial.avatar = image;
      }
    }

    /**
     * 🎥 4. VIDEO URL
     */
    if (updateTestimonialDto.videoId !== undefined) {
      if (!updateTestimonialDto.videoId) {
        testimonial.video = null;
      } else {
        const video = await this.uploadsService.getOneById(
          updateTestimonialDto.videoId,
        );

        if (!video) {
          throw new BadRequestException('Invalid video');
        }

        testimonial.video = video;
      }
    }

    /**
     * 📝 5. MESSAGE
     */
    if (updateTestimonialDto.message !== undefined) {
      if (finalType !== TestimonialType.TEXT) {
        throw new BadRequestException(
          'message only allowed for text testimonials',
        );
      }
      testimonial.message = updateTestimonialDto.message;
    }

    /**
     * 📚 6. COURSE RELATION
     */
    if (updateTestimonialDto.courseId !== undefined) {
      if (!updateTestimonialDto.courseId) {
        testimonial.course = null;
      } else {
        const course = await this.coursesService.findOneById(
          updateTestimonialDto.courseId,
        );

        if (!course) {
          throw new BadRequestException('Invalid courseId');
        }

        testimonial.course = course;
      }
    }

    /**
     * ⭐ 7. SIMPLE FIELDS
     */
    if (updateTestimonialDto.name !== undefined)
      testimonial.name = updateTestimonialDto.name;
    if (updateTestimonialDto.designation !== undefined)
      testimonial.designation = updateTestimonialDto.designation;
    if (updateTestimonialDto.company !== undefined)
      testimonial.company = updateTestimonialDto.company;
    if (updateTestimonialDto.rating !== undefined)
      testimonial.rating = updateTestimonialDto.rating;
    if (updateTestimonialDto.isActive !== undefined)
      testimonial.isActive = updateTestimonialDto.isActive;
    if (updateTestimonialDto.isFeatured !== undefined)
      testimonial.isFeatured = updateTestimonialDto.isFeatured;
    if (updateTestimonialDto.priority !== undefined)
      testimonial.priority = updateTestimonialDto.priority;
    if (updateTestimonialDto.status !== undefined)
      testimonial.status = updateTestimonialDto.status;

    /**
     * 🧠 8. FINAL SAFETY CHECK
     */
    if (testimonial.type === TestimonialType.VIDEO && !testimonial.video) {
      throw new BadRequestException('video testimonial must have video');
    }

    if (testimonial.type === TestimonialType.TEXT && !testimonial.message) {
      throw new BadRequestException('text testimonial must have message');
    }

    return await this.testimonialRepository.save(testimonial);
  }
}
