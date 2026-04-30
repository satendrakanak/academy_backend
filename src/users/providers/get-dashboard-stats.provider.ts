import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
  ) {}

  async getDashboardStats(userId: number) {
    const [courses, completed, progress] = await Promise.all([
      this.enrollmentsService.getUserCourseCount(userId),
      this.getCompletedCoursesCount(userId),
      this.getAverageProgress(userId),
    ]);

    return {
      courses,
      completed,
      progress,
    };
  }

  async getWeeklyProgress(userId: number): Promise<WeeklyProgress[]> {
    const result = await this.userProgressRepository
      .createQueryBuilder('progress')
      .select([
        'DATE(progress.updatedAt) as date',
        'AVG(progress.progress) as avgProgress',
      ])
      .where('progress.userId = :userId', { userId })
      .andWhere("progress.updatedAt >= NOW() - INTERVAL '7 days'")
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    return result.map((item) => ({
      day: new Date(item.date).toLocaleDateString('en-US', {
        weekday: 'short',
      }),
      progress: Math.round(item.avgProgress),
    }));
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
    const courses = await this.userProgressRepository
      .createQueryBuilder('progress')
      .leftJoin('progress.lecture', 'lecture')
      .leftJoin('lecture.chapter', 'chapter')
      .leftJoin('chapter.course', 'course')
      .select('course.id', 'courseId')
      .addSelect('AVG(progress.progress)', 'avgProgress')
      .where('progress.userId = :userId', { userId })
      .groupBy('course.id')
      .getRawMany();

    if (!courses.length) return 0;

    const total = courses.reduce((sum, course) => {
      return sum + Number(course.avgProgress);
    }, 0);

    return Math.round(total / courses.length);
  }
}
