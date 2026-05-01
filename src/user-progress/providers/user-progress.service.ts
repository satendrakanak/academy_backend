import { Injectable } from '@nestjs/common';
import { UserProgres } from '../user-progres.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateLectureProgressDto } from '../dtos/update-lecture-progress.dto';
import { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { WeeklyProgress } from '../interfaces/weekly-progress.interface';
import { CertificatesService } from 'src/certificates/providers/certificates.service';

@Injectable()
export class UserProgressService {
  constructor(
    /**
     * Inject userProgressRepository
     */
    @InjectRepository(UserProgres)
    private readonly userProgressRepository: Repository<UserProgres>,

    private readonly certificatesService: CertificatesService,
  ) {}

  async getLectureProgress(user: ActiveUserData, lectureId: number) {
    const userId = user.sub;

    const record = await this.userProgressRepository.findOne({
      where: {
        user: { id: userId },
        lecture: { id: lectureId },
      },
    });

    if (!record) {
      return {
        isCompleted: false,
        progress: 0,
        lastTime: 0,
      };
    }

    return {
      isCompleted: record.isCompleted,
      progress: record.progress,
      lastTime: record.lastTime,
    };
  }

  async getCourseProgress(user: ActiveUserData, courseId: number) {
    const userId = user.sub;

    const records = await this.userProgressRepository.find({
      where: {
        user: { id: userId },
        lecture: {
          chapter: {
            course: { id: courseId },
          },
        },
      },
      relations: ['lecture'],
    });

    const progressMap: Record<
      number,
      { isCompleted: boolean; progress: number; lastTime: number }
    > = {};

    records.forEach((record) => {
      progressMap[record.lecture.id] = {
        isCompleted: record.isCompleted,
        progress: record.progress,
        lastTime: record.lastTime,
      };
    });

    return progressMap;
  }
  async getCourseProgressSummary(user: ActiveUserData, courseId: number) {
    const userId = user.sub;

    const records = await this.userProgressRepository.find({
      where: {
        user: { id: userId },
        lecture: {
          chapter: {
            course: { id: courseId },
          },
        },
      },
    });

    if (!records.length) {
      return {
        isCompleted: false,
        progress: 0,
        lastTime: 0,
      };
    }

    // ✅ total lectures (simple count query)
    const totalLectures = await this.userProgressRepository.manager
      .getRepository('Lecture')
      .count({
        where: {
          chapter: {
            course: { id: courseId },
          },
          isPublished: true,
        },
      });

    const completed = records.filter((r) => r.isCompleted).length;

    const progress = Math.round((completed / totalLectures) * 100);

    // ✅ latest time (simple)
    const lastTime = Math.max(...records.map((r) => r.lastTime), 0);

    return {
      isCompleted: progress === 100,
      progress,
      lastTime,
    };
  }

  async getMultipleCourseProgressSummary(
    user: ActiveUserData,
    courseIds: number[],
  ) {
    const result: Record<
      number,
      { isCompleted: boolean; progress: number; lastTime: number }
    > = {};

    for (const courseId of courseIds) {
      result[courseId] = await this.getCourseProgressSummary(user, courseId);
    }

    return result;
  }
  async updateLectureProgress(
    user: ActiveUserData,
    updateLectureProgressDto: UpdateLectureProgressDto,
  ) {
    const userId = user.sub;
    const { lectureId, progress, lastTime } = updateLectureProgressDto;

    const isCompleted = progress >= 90;

    const record = await this.userProgressRepository.findOne({
      where: {
        user: { id: userId },
        lecture: { id: lectureId },
      },
    });

    if (record) {
      record.progress = progress;
      record.lastTime = lastTime;

      if (record.isCompleted) {
      } else if (isCompleted) {
        record.isCompleted = true;
      }

      const savedRecord = await this.userProgressRepository.save(record);

      if (savedRecord.isCompleted) {
        await this.certificatesService
          .ensureFromLecture(userId, lectureId)
          .catch(() => null);
      }

      return savedRecord;
    }

    const newRecord = this.userProgressRepository.create({
      user: { id: userId },
      lecture: { id: lectureId },
      progress,
      lastTime,
      isCompleted,
    });

    const savedRecord = await this.userProgressRepository.save(newRecord);

    if (savedRecord.isCompleted) {
      await this.certificatesService
        .ensureFromLecture(userId, lectureId)
        .catch(() => null);
    }

    return savedRecord;
  }

  async getCompletedCoursesCount(userId: number): Promise<number> {
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

  async getAverageProgress(userId: number): Promise<number> {
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

    const total = courses.reduce((sum, c) => sum + Number(c.avgProgress), 0);

    return Math.round(total / courses.length);
  }

  async getWeeklyProgress(userId: number): Promise<WeeklyProgress[]> {
    const timezone = 'Asia/Kolkata';
    const result = await this.userProgressRepository
      .createQueryBuilder('progress')
      .select([
        `TO_CHAR(timezone('${timezone}', progress.updatedAt), 'YYYY-MM-DD') as date`,
        'MAX(progress.progress) as peakProgress',
        'COUNT(progress.id) as activityCount',
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
        Math.round(
          Math.max(
            Number(item.peakProgress) || 0,
            Math.min(Number(item.activityCount || 0) * 20, 100),
          ),
        ),
      ]),
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
}
