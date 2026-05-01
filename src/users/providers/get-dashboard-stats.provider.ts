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
    const timezone = 'Asia/Kolkata';
    const result = await this.userProgressRepository
      .createQueryBuilder('progress')
      .select([
        `DATE(timezone('${timezone}', progress.updatedAt)) as date`,
        'AVG(progress.progress) as avgProgress',
      ])
      .where('progress.userId = :userId', { userId })
      .andWhere(
        `timezone('${timezone}', progress.updatedAt) >= timezone('${timezone}', NOW()) - INTERVAL '6 days'`,
      )
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    const progressByDate = new Map(
      result.map((item) => [
        item.date,
        Math.round(Number(item.avgProgress) || 0),
      ]),
    );

    const days: WeeklyProgress[] = [];
    const today = new Date();

    for (let offset = 6; offset >= 0; offset--) {
      const date = new Date(today);
      date.setDate(today.getDate() - offset);

      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });

      const formattedDate = formatter.format(date);

      days.push({
        day: new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          weekday: 'short',
        }).format(date),
        progress: progressByDate.get(formattedDate) ?? 0,
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
