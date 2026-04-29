import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Paginated } from 'src/common/pagination/interfaces/paginated.interface';
import { PaginationProvider } from 'src/common/pagination/providers/pagination.provider';
import { MediaFileMappingService } from 'src/common/media-file-mapping/providers/media-file-mapping.service';
import { CoursesService } from 'src/courses/providers/courses.service';
import { UploadsService } from 'src/uploads/providers/uploads.service';
import { CreateTestimonialDto } from '../dtos/create-testimonial.dto';
import { GetTestimonialsDto } from '../dtos/get-testimonials.dto';
import { UpdateTestimonialDto } from '../dtos/update-testimonial.dto';
import { TestimonialStatus } from '../enums/testimonial-status.enum';
import { TestimonialType } from '../enums/testimonial-type.enum';
import { Testimonial } from '../testimonial.entity';
import { UpdateTestimonialProvider } from './update-testimonial.provider';

@Injectable()
export class TestimonialsService {
  constructor(
    @InjectRepository(Testimonial)
    private readonly testimonialsRepository: Repository<Testimonial>,

    private readonly updateTestimonialProvider: UpdateTestimonialProvider,

    private readonly uploadsService: UploadsService,

    private readonly coursesService: CoursesService,

    private readonly paginationProvider: PaginationProvider,

    private readonly mediaFileMappingService: MediaFileMappingService,
  ) {}

  async findAll(
    getTestimonialsDto: GetTestimonialsDto,
  ): Promise<Paginated<Testimonial>> {
    const result = await this.paginationProvider.paginateQuery(
      getTestimonialsDto,
      this.testimonialsRepository,
      {
        where: this.buildWhere(getTestimonialsDto),
        relations: ['avatar', 'video', 'courses', 'courses.image', 'courses.video'],
        order: {
          priority: 'ASC',
          createdAt: 'DESC',
        },
      },
    );

    result.data = this.mediaFileMappingService.mapTestimonials(result.data);

    return result;
  }

  async findPublic(
    getTestimonialsDto: GetTestimonialsDto,
  ): Promise<Paginated<Testimonial>> {
    const result = await this.paginationProvider.paginateQuery(
      getTestimonialsDto,
      this.testimonialsRepository,
      {
        where: this.buildWhere(getTestimonialsDto, true),
        relations: ['avatar', 'video', 'courses', 'courses.image', 'courses.video'],
        order: {
          priority: 'ASC',
          createdAt: 'DESC',
        },
      },
    );

    result.data = this.mediaFileMappingService.mapTestimonials(result.data);

    return result;
  }

  async getFeatured(limit = 10): Promise<Testimonial[]> {
    const testimonials = await this.testimonialsRepository.find({
      where: {
        isActive: true,
        isFeatured: true,
        status: TestimonialStatus.APPROVED,
      },
      relations: ['avatar', 'video', 'courses', 'courses.image', 'courses.video'],
      order: {
        priority: 'ASC',
        createdAt: 'DESC',
      },
      take: limit,
    });

    return this.mediaFileMappingService.mapTestimonials(testimonials);
  }

  async findOneById(id: string): Promise<Testimonial> {
    const testimonial = await this.testimonialsRepository.findOne({
      where: { id },
      relations: ['avatar', 'video', 'courses', 'courses.image', 'courses.video'],
    });

    if (!testimonial) {
      throw new NotFoundException('Testimonial not found');
    }

    return this.mediaFileMappingService.mapTestimonial(testimonial);
  }

  async findPublicById(id: string): Promise<Testimonial> {
    const testimonial = await this.testimonialsRepository.findOne({
      where: {
        id,
        isActive: true,
        status: TestimonialStatus.APPROVED,
      },
      relations: ['avatar', 'video', 'courses', 'courses.image', 'courses.video'],
    });

    if (!testimonial) {
      throw new NotFoundException('Testimonial not found');
    }

    return this.mediaFileMappingService.mapTestimonial(testimonial);
  }

  async create(
    createTestimonialDto: CreateTestimonialDto,
  ): Promise<Testimonial> {
    const type = createTestimonialDto.type ?? TestimonialType.TEXT;

    if (type === TestimonialType.TEXT && !createTestimonialDto.message) {
      throw new BadRequestException('message is required for text testimonial');
    }

    if (type === TestimonialType.VIDEO && !createTestimonialDto.videoId) {
      throw new BadRequestException(
        'videoId is required for video testimonial',
      );
    }

    const image =
      createTestimonialDto.avatarId == null
        ? null
        : await this.uploadsService.getOneById(createTestimonialDto.avatarId);
    const video =
      createTestimonialDto.videoId == null
        ? null
        : await this.uploadsService.getOneById(createTestimonialDto.videoId);
    const courses =
      !createTestimonialDto.courseIds?.length
        ? []
        : await Promise.all(
            createTestimonialDto.courseIds.map((courseId) =>
              this.coursesService.findOneById(courseId),
            ),
          );

    const testimonial = this.testimonialsRepository.create({
      name: createTestimonialDto.name,
      designation: createTestimonialDto.designation,
      company: createTestimonialDto.company,
      type,
      message:
        type === TestimonialType.TEXT
          ? createTestimonialDto.message
          : undefined,
      video: type === TestimonialType.VIDEO ? video : null,
      avatar: image,
      avatarAlt: createTestimonialDto.avatarAlt,
      courses,
      rating: createTestimonialDto.rating ?? 5,
      status: createTestimonialDto.status ?? TestimonialStatus.PENDING,
      isActive: createTestimonialDto.isActive ?? false,
      isFeatured: createTestimonialDto.isFeatured ?? false,
      priority: createTestimonialDto.priority ?? 0,
    });

    const saved = await this.testimonialsRepository.save(testimonial);

    return this.mediaFileMappingService.mapTestimonial(saved);
  }

  async update(
    id: string,
    updateTestimonialDto: UpdateTestimonialDto,
  ): Promise<Testimonial> {
    const testimonial = await this.updateTestimonialProvider.update(
      id,
      updateTestimonialDto,
    );

    return this.mediaFileMappingService.mapTestimonial(testimonial);
  }

  async delete(id: string): Promise<{ message: string }> {
    const result = await this.testimonialsRepository.delete(id);

    if (!result.affected) {
      throw new NotFoundException('Testimonial not found');
    }

    return {
      message: 'Testimonial deleted successfully',
    };
  }

  private buildWhere(
    getTestimonialsDto: GetTestimonialsDto,
    publicOnly = false,
  ): FindOptionsWhere<Testimonial> {
    const where: FindOptionsWhere<Testimonial> = {};

    if (getTestimonialsDto.type) {
      where.type = getTestimonialsDto.type;
    }

    if (getTestimonialsDto.status) {
      where.status = getTestimonialsDto.status;
    }

    if (getTestimonialsDto.isActive !== undefined) {
      where.isActive = getTestimonialsDto.isActive;
    }

    if (getTestimonialsDto.isFeatured !== undefined) {
      where.isFeatured = getTestimonialsDto.isFeatured;
    }

    if (getTestimonialsDto.courseId !== undefined) {
      (where as any).courses = [
        {
          id: getTestimonialsDto.courseId,
        },
      ];
    }

    if (publicOnly) {
      where.isActive = true;
      where.status = TestimonialStatus.APPROVED;
    }

    return where;
  }
}
