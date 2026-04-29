import { Injectable } from '@nestjs/common';
import { EnrollmentsService } from 'src/enrollments/providers/enrollments.service';
import { WeeklyProgress } from 'src/user-progress/interfaces/weekly-progress.interface';
import { UserProgressService } from 'src/user-progress/providers/user-progress.service';

@Injectable()
export class GetDashboardStatsProvider {
  constructor(
    /**
     * Inject enrollmentsService
     */

    private readonly enrollmentsService: EnrollmentsService,
    /**
     * Inject userProgressService
     */

    private readonly userProgressService: UserProgressService,
  ) {}

  async getDashboardStats(userId: number) {
    const [courses, completed, progress] = await Promise.all([
      this.enrollmentsService.getUserCourseCount(userId),
      this.userProgressService.getCompletedCoursesCount(userId),
      this.userProgressService.getAverageProgress(userId),
    ]);

    return {
      courses,
      completed,
      progress,
    };
  }
  async getWeeklyProgress(userId: number): Promise<WeeklyProgress[]> {
    return this.userProgressService.getWeeklyProgress(userId);
  }
}
