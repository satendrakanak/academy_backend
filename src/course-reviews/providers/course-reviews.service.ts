import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MediaFileMappingService } from 'src/common/media-file-mapping/providers/media-file-mapping.service';
import { Course } from 'src/courses/course.entity';
import { Enrollment } from 'src/enrollments/enrollment.entity';
import { User } from 'src/users/user.entity';
import { Repository } from 'typeorm';
import { CourseReview } from '../course-review.entity';
import { CreateCourseReviewDto } from '../dtos/create-course-review.dto';

@Injectable()
export class CourseReviewsService {
  constructor(
    @InjectRepository(CourseReview)
    private readonly courseReviewRepository: Repository<CourseReview>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    private readonly mediaFileMappingService: MediaFileMappingService,
  ) {}

  async getByCourse(courseId: number) {
    const reviews = await this.courseReviewRepository.find({
      where: { course: { id: courseId }, isPublished: true },
      relations: ['user', 'user.avatar'],
      order: { createdAt: 'DESC' },
    });

    return reviews.map((review) => this.mapReviewMedia(review));
  }

  async getMine(courseId: number, userId: number) {
    const review = await this.courseReviewRepository.findOne({
      where: { course: { id: courseId }, user: { id: userId } },
      relations: ['course', 'course.image', 'user', 'user.avatar'],
      withDeleted: false,
    });

    return review ? this.mapReviewMedia(review) : null;
  }

  async getSummary(courseId: number) {
    const reviews = await this.courseReviewRepository.find({
      where: { course: { id: courseId }, isPublished: true },
      select: { id: true, rating: true },
    });

    const total = reviews.length;
    const average = total
      ? Number(
          (
            reviews.reduce((sum, review) => sum + review.rating, 0) / total
          ).toFixed(1),
        )
      : 0;

    const breakdown = [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: reviews.filter((review) => review.rating === rating).length,
    }));

    return { average, total, breakdown };
  }

  async findAll() {
    const reviews = await this.courseReviewRepository.find({
      relations: ['course', 'course.image', 'user', 'user.avatar'],
      order: { createdAt: 'DESC' },
      withDeleted: false,
    });

    return reviews.map((review) => this.mapReviewMedia(review));
  }

  async upsert(
    courseId: number,
    userId: number,
    createCourseReviewDto: CreateCourseReviewDto,
  ) {
    const [course, user, enrollment] = await Promise.all([
      this.courseRepository.findOne({ where: { id: courseId } }),
      this.userRepository.findOne({ where: { id: userId } }),
      this.enrollmentRepository.findOne({
        where: { course: { id: courseId }, user: { id: userId } },
      }),
    ]);

    if (!course) throw new NotFoundException('Course not found');
    if (!user) throw new NotFoundException('User not found');
    if (!enrollment) {
      throw new ForbiddenException('Only enrolled users can review this course');
    }

    let review = await this.courseReviewRepository.findOne({
      where: { course: { id: courseId }, user: { id: userId } },
      withDeleted: true,
    });

    if (!review) {
      review = this.courseReviewRepository.create({ course, user });
    }

    review.rating = createCourseReviewDto.rating;
    review.comment = createCourseReviewDto.comment?.trim() || null;
    review.isPublished = false;
    review.deletedAt = null as unknown as Date;

    const saved = await this.courseReviewRepository.save(review);
    return this.mapReviewMedia(saved);
  }

  async setPublished(id: number, isPublished: boolean) {
    const review = await this.courseReviewRepository.findOne({
      where: { id },
      relations: ['course', 'user', 'user.avatar'],
    });

    if (!review) throw new NotFoundException('Review not found');

    review.isPublished = isPublished;
    const saved = await this.courseReviewRepository.save(review);
    return this.mapReviewMedia(saved);
  }

  async update(
    id: number,
    userId: number,
    roles: string[],
    createCourseReviewDto: CreateCourseReviewDto,
  ) {
    const review = await this.courseReviewRepository.findOne({
      where: { id },
      relations: ['course', 'user', 'user.avatar'],
    });

    if (!review) throw new NotFoundException('Review not found');
    if (!this.canManage(review.user.id, userId, roles)) {
      throw new ForbiddenException('You can edit only your own review');
    }

    review.rating = createCourseReviewDto.rating;
    review.comment = createCourseReviewDto.comment?.trim() || null;
    review.isPublished = roles.includes('admin') ? review.isPublished : false;
    const saved = await this.courseReviewRepository.save(review);
    return this.mapReviewMedia(saved);
  }

  async delete(id: number, userId: number, roles: string[] = []) {
    const review = await this.courseReviewRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!review) throw new NotFoundException('Review not found');
    if (!this.canManage(review.user.id, userId, roles)) {
      throw new ForbiddenException('You can delete only your own review');
    }

    await this.courseReviewRepository.softDelete(id);
    return { message: 'Review deleted successfully' };
  }

  private canManage(ownerId: number, userId: number, roles: string[] = []) {
    return ownerId === userId || roles.includes('admin');
  }

  private mapReviewMedia(review: CourseReview) {
    if (review.user?.avatar) {
      review.user.avatar = this.mediaFileMappingService.mapFile(
        review.user.avatar,
      );
    }

    if (review.course?.image) {
      review.course.image = this.mediaFileMappingService.mapFile(
        review.course.image,
      );
    }

    return review;
  }
}
