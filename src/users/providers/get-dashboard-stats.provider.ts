import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Certificate } from 'src/certificates/certificate.entity';
import { CourseExamAttempt } from 'src/course-exams/course-exam-attempt.entity';
import { Course } from 'src/courses/course.entity';
import { EnrollmentsService } from 'src/enrollments/providers/enrollments.service';
import { WeeklyProgress } from 'src/user-progress/interfaces/weekly-progress.interface';
import { UserProgres } from 'src/user-progress/user-progres.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GetDashboardStatsProvider {
  constructor(
    /**
     * Inject enrollmentsService
     */

    private readonly enrollmentsService: EnrollmentsService,

    /**
     * Inject userProgressRepository
     */
    @InjectRepository(UserProgres)
    private readonly userProgressRepository: Repository<UserProgres>,

    @InjectRepository(CourseExamAttempt)
    private readonly courseExamAttemptRepository: Repository<CourseExamAttempt>,

    @InjectRepository(Certificate)
    private readonly certificateRepository: Repository<Certificate>,

    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  async getDashboardStats(userId: number) {
    const [
      courses,
      completed,
      progress,
      examsTaken,
      examsPassed,
      certificatesEarned,
    ] = await Promise.all([
      this.enrollmentsService.getUserCourseCount(userId),
      this.getCompletedCoursesCount(userId),
      this.getAverageProgress(userId),
      this.courseExamAttemptRepository.count({
        where: { user: { id: userId } },
      }),
      this.courseExamAttemptRepository.count({
        where: { user: { id: userId }, passed: true },
      }),
      this.certificateRepository.count({ where: { user: { id: userId } } }),
    ]);

    return {
      courses,
      completed,
      progress,
      examsTaken,
      examsPassed,
      certificatesEarned,
    };
  }

  async getWeeklyProgress(userId: number): Promise<WeeklyProgress[]> {
    const timezone = 'Asia/Kolkata';
    const completionThreshold = 100;

    const result = await this.userProgressRepository
      .createQueryBuilder('progress')
      .select([
        `TO_CHAR(timezone('${timezone}', progress.updatedAt), 'YYYY-MM-DD') as "date"`,
        `COUNT(DISTINCT progress.lectureId) as "completedLectures"`,
      ])
      .where('progress.userId = :userId', { userId })
      .andWhere('progress.progress >= :completionThreshold', {
        completionThreshold,
      })
      .andWhere(
        `timezone('${timezone}', progress.updatedAt)::date >= timezone('${timezone}', NOW())::date - INTERVAL '6 days'`,
      )
      .groupBy('"date"')
      .orderBy('"date"', 'ASC')
      .getRawMany();

    const completedByDate = new Map(
      result.map((item) => [item.date, Number(item.completedLectures) || 0]),
    );

    const totalCompletedThisWeek = result.reduce(
      (sum, item) => sum + Number(item.completedLectures || 0),
      0,
    );

    const days: WeeklyProgress[] = [];
    const today = new Date();

    for (let offset = 6; offset >= 0; offset--) {
      const date = new Date(today);
      date.setDate(today.getDate() - offset);

      const formattedDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date);

      const completedLectures = completedByDate.get(formattedDate) ?? 0;

      days.push({
        day: new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          weekday: 'short',
        }).format(date),

        progress:
          totalCompletedThisWeek === 0
            ? 0
            : Math.round((completedLectures / totalCompletedThisWeek) * 100),
      });
    }

    return days;
  }

  private async getCompletedCoursesCount(userId: number): Promise<number> {
    const courses = await this.userProgressRepository
      .createQueryBuilder('progress')
      .leftJoin('progress.lecture', 'lecture')
      .leftJoin('lecture.chapter', 'chapter')
      .leftJoin('chapter.course', 'course')
      .select('course.id', 'courseId')
      .addSelect('COUNT(lecture.id)', 'completedLectures')
      .where('progress.userId = :userId', { userId })
      .andWhere('progress.isCompleted = true')
      .groupBy('course.id')
      .getRawMany();

    let completedCourses = 0;

    for (const course of courses) {
      const totalLectures = await this.userProgressRepository.manager
        .getRepository('Lecture')
        .count({
          where: {
            chapter: {
              course: { id: course.courseId },
            },
            isPublished: true,
          },
        });

      if (Number(course.completedLectures) === totalLectures) {
        completedCourses++;
      }
    }

    return completedCourses;
  }

  private async getAverageProgress(userId: number): Promise<number> {
    const courses = await this.courseRepository
      .createQueryBuilder('course')
      .innerJoin(
        'course.enrollments',
        'enrollment',
        'enrollment.userId = :userId AND enrollment.isActive = true',
        { userId },
      )
      .leftJoin('course.chapters', 'chapter')
      .leftJoin('chapter.lectures', 'lecture', 'lecture.isPublished = true')
      .leftJoin('lecture.progress', 'progress', 'progress.userId = :userId', {
        userId,
      })
      .select('course.id', 'courseId')
      .addSelect('COUNT(DISTINCT lecture.id)', 'totalLectures')
      .addSelect(
        `COUNT(DISTINCT CASE WHEN progress.progress >= 100 THEN lecture.id END)`,
        'completedLectures',
      )
      .where('course.isPublished = true')
      .groupBy('course.id')
      .getRawMany();

    if (!courses.length) return 0;

    const totalProgress = courses.reduce((sum, course) => {
      const totalLectures = Number(course.totalLectures) || 0;
      const completedLectures = Number(course.completedLectures) || 0;

      const courseProgress =
        totalLectures === 0 ? 0 : (completedLectures / totalLectures) * 100;

      return sum + courseProgress;
    }, 0);

    return Math.round(totalProgress / courses.length);
  }
}
