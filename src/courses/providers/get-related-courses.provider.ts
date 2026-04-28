import { Injectable } from '@nestjs/common';
import { Course } from '../course.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { MediaFileMappingService } from 'src/common/media-file-mapping/providers/media-file-mapping.service';
import { EnrollmentsService } from 'src/enrollments/providers/enrollments.service';
import { UserProgressService } from 'src/user-progress/providers/user-progress.service';
import { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';

@Injectable()
export class GetRelatedCoursesProvider {
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
  async getRelatedCourses(courseId: number, user?: ActiveUserData) {
    const courses = await this.courseRepository.find({
      where: {
        isFeatured: true,
        isPublished: true,
        id: Not(courseId),
      },
      relations: [
        'createdBy',
        'updatedBy',
        'image',
        'video',
        'categories',
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
}
