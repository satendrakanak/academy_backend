import { Injectable, NotFoundException } from '@nestjs/common';
import { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { CreateCourseDto } from '../dtos/create-course.dto';
import { CreateCourseProvider } from './create-course.provider';
import { PaginationProvider } from 'src/common/pagination/providers/pagination.provider';
import { GetCoursesDto } from '../dtos/get-courses.dto';
import { Paginated } from 'src/common/pagination/interfaces/paginated.interface';
import { Course } from '../course.entity';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PatchCourseDto } from '../dtos/patch-course.dto';
import { UpdateCourseProvider } from './update-course.provider';
import { MediaFileMappingService } from 'src/common/media-file-mapping/providers/media-file-mapping.service';
import { FindOneBySlugProvider } from './find-one-by-slug.provider';
import { EnrollmentsService } from 'src/enrollments/providers/enrollments.service';
import { UserProgressService } from 'src/user-progress/providers/user-progress.service';
import { GetFeaturedCoursesProvider } from './get-featured-courses.provider';
import { GetRelatedCoursesProvider } from './get-related-courses.provider';
import { GetEnrolledCoursesProvider } from './get-enrolled-courses.provider';

@Injectable()
export class CoursesService {
  constructor(
    /**
     * Inject courseRepository
     */
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,

    /**
     * Inject createCourseProvider
     */
    private readonly createCourseProvider: CreateCourseProvider,

    /**
     * Inject updateCourseProvider
     */

    private readonly updateCourseProvider: UpdateCourseProvider,

    /**
     * Inject findOneBySlugProvider
     */

    private readonly findOneBySlugProvider: FindOneBySlugProvider,

    /**
     * Inject paginatedProvider
     */

    private readonly paginationProvider: PaginationProvider,

    /**
     * Inject mediaFileMappingService
     */
    private readonly mediaFileMappingService: MediaFileMappingService,
    /**
     * Inject enrollmentsService
     */
    private readonly enrollmentsService: EnrollmentsService,

    /**
     * Inject userProgressService
     */
    private readonly userProgressService: UserProgressService,

    /**
     * Inject getFeaturedCoursesProvider
     */

    private readonly getFeaturedCoursesProvider: GetFeaturedCoursesProvider,

    /**
     * Inject getRelatedCoursesProvider
     */

    private readonly getRelatedCoursesProvider: GetRelatedCoursesProvider,

    /**
     * Inject getEnrolledCoursesProvider
     */

    private readonly getEnrolledCoursesProvider: GetEnrolledCoursesProvider,
  ) {}

  public async findAll(
    getCoursesDto: GetCoursesDto,
    user?: ActiveUserData,
  ): Promise<Paginated<Course> | Course[]> {
    /**
     * 🔥 NO PAGINATION (website case)
     */
    if (getCoursesDto.isPublished) {
      const courses = await this.courseRepository.find({
        where: {
          isPublished: true,
        },
        relations: [
          'createdBy',
          'updatedBy',
          'image',
          'video',
          'categories',
          'faculties',
          'tags',
          'chapters',
          'chapters.lectures',
          'chapters.lectures.video',
          'chapters.lectures.attachments',
          'chapters.lectures.attachments.file',
        ],
        order: {
          createdAt: 'DESC',
        },
      });

      const mapped = this.mediaFileMappingService.mapCourses(courses);
      if (!user) {
        return mapped.map((c) => ({
          ...c,
          isEnrolled: false,
          progress: null,
        }));
      }
      const courseIds = mapped.map((c) => c.id);

      const [enrollmentMap, progressMap] = await Promise.all([
        this.enrollmentsService.checkMultipleEnrollments(user.sub, courseIds),
        this.userProgressService.getMultipleCourseProgressSummary(
          user,
          courseIds,
        ),
      ]);

      return mapped.map((course) => ({
        ...course,
        isEnrolled: enrollmentMap[course.id] ?? false,
        progress: progressMap[course.id] ?? {
          isCompleted: false,
          progress: 0,
          lastTime: 0,
        },
      }));
    }

    /**
     * 🔥 PAGINATION (admin case)
     */
    const result = await this.paginationProvider.paginateQuery(
      {
        limit: getCoursesDto.limit ?? 10,
        page: getCoursesDto.page ?? 1,
      },
      this.courseRepository,
      {
        relations: ['image', 'categories', 'tags', 'faculties'],
        order: {
          createdAt: 'DESC',
        },
      },
    );

    result.data = this.mediaFileMappingService.mapCourses(result.data);

    return result;
  }
  public async findOneById(id: number): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: [
        'createdBy',
        'updatedBy',
        'image',
        'video',
        'categories',
        'tags',
        'faculties',
        'chapters',
        'chapters.lectures',
        'chapters.lectures.video',
        'chapters.lectures.attachments',
        'chapters.lectures.attachments.file',
      ],
      order: {
        chapters: {
          position: 'ASC',
          lectures: {
            position: 'ASC',
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return this.mediaFileMappingService.mapCourse(course);
  }

  async findManyByIds(ids: number[]) {
    return this.courseRepository.findBy({
      id: In(ids),
    });
  }

  async findOneBySlug(slug: string, user: ActiveUserData): Promise<Course> {
    return await this.findOneBySlugProvider.findOneBySlug(slug, user);
  }

  async findCourseForLearning(slug: string, user: ActiveUserData) {
    return await this.findOneBySlugProvider.getCourseForLearning(slug, user);
  }

  async getFeaturedCourses(user?: ActiveUserData) {
    return await this.getFeaturedCoursesProvider.getFeaturedCourses(user);
  }

  async getRelatedCourses(courseId: number, user: ActiveUserData) {
    return await this.getRelatedCoursesProvider.getRelatedCourses(
      courseId,
      user,
    );
  }

  async getEnrolledCourses(userId: number, user?: ActiveUserData) {
    return await this.getEnrolledCoursesProvider.getEnrolledCourses(
      userId,
      user,
    );
  }

  public async create(createCouseDto: CreateCourseDto, user: ActiveUserData) {
    return await this.createCourseProvider.create(createCouseDto, user);
  }
  public async update(
    id: number,
    patchCourseDto: PatchCourseDto,
    user: ActiveUserData,
  ) {
    return await this.updateCourseProvider.update(id, patchCourseDto, user);
  }
  public async delete(id: number) {
    const result = await this.courseRepository.delete(id);

    if (!result.affected) {
      throw new NotFoundException('Course not found');
    }
    return {
      message: 'Course deleted successfully',
    };
  }
  public async softDelete() {}
  public async restore() {}
}
