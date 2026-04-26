import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Course } from '../course.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MediaFileMappingService } from 'src/common/media-file-mapping/providers/media-file-mapping.service';
import { EnrollmentsService } from 'src/enrollments/providers/enrollments.service';
import { UserProgressService } from 'src/user-progress/providers/user-progress.service';
import { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import {
  CourseProgress,
  CourseWithAccess,
} from '../types/course-with-access.type';

@Injectable()
export class FindOneBySlugProvider {
  constructor(
    /**
     * Inject courseRepository
     */

    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,

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
  ) {}

  async findOneBySlug(
    slug: string,
    user: ActiveUserData,
  ): Promise<CourseWithAccess> {
    const course = await this.courseRepository
      .createQueryBuilder('course')

      // 🔥 RELATIONS
      .leftJoinAndSelect('course.createdBy', 'createdBy')
      .leftJoinAndSelect('course.updatedBy', 'updatedBy')
      .leftJoinAndSelect('course.image', 'image')
      .leftJoinAndSelect('course.video', 'video')
      .leftJoinAndSelect('course.categories', 'categories')
      .leftJoinAndSelect('course.tags', 'tags')

      // 🔥 CHAPTERS (ONLY PUBLISHED)
      .leftJoinAndSelect(
        'course.chapters',
        'chapters',
        'chapters.isPublished = :chapterPublished',
        { chapterPublished: true },
      )

      // 🔥 LECTURES (ONLY PUBLISHED)
      .leftJoinAndSelect(
        'chapters.lectures',
        'lectures',
        'lectures.isPublished = :lecturePublished',
        { lecturePublished: true },
      )

      // 🔥 NESTED RELATIONS
      .leftJoinAndSelect('lectures.video', 'lectureVideo')
      .leftJoinAndSelect('lectures.attachments', 'attachments')
      .leftJoinAndSelect('attachments.file', 'file')

      // 🔥 COURSE FILTER
      .where('course.slug = :slug', { slug })
      .andWhere('course.isPublished = :coursePublished', {
        coursePublished: true,
      })

      // 🔥 ORDERING
      .orderBy('chapters.position', 'ASC')
      .addOrderBy('lectures.position', 'ASC')

      .getOne();

    if (!course) {
      throw new NotFoundException('Course not found');
    }
    const mappedCourse = this.mediaFileMappingService.mapCourse(course);
    let isEnrolled = false;
    let progress: CourseProgress = {
      isCompleted: false,
      progress: 0,
      lastTime: 0,
    };

    if (user) {
      const enrollment = await this.enrollmentsService.checkEnrollment(
        user.sub,
        course.id,
      );

      isEnrolled = !!enrollment;

      if (isEnrolled) {
        const progressData =
          await this.userProgressService.getCourseProgressSummary(
            user,
            course.id,
          );

        progress = progressData;
      }
    }

    return {
      ...mappedCourse,
      isEnrolled,
      progress,
    };
  }

  async getCourseForLearning(slug: string, user: ActiveUserData) {
    const course = await this.findOneBySlug(slug, user);

    if (!course.isEnrolled) {
      throw new ForbiddenException("You don't have access to this course");
    }

    return course;
  }
}
