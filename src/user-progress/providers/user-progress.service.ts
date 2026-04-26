import { Injectable } from '@nestjs/common';
import { UserProgres } from '../user-progres.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateLectureProgressDto } from '../dtos/update-lecture-progress.dto';
import { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';

@Injectable()
export class UserProgressService {
  constructor(
    /**
     * Inject userProgressRepository
     */
    @InjectRepository(UserProgres)
    private readonly userProgressRepository: Repository<UserProgres>,
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

      return this.userProgressRepository.save(record);
    }

    const newRecord = this.userProgressRepository.create({
      user: { id: userId },
      lecture: { id: lectureId },
      progress,
      lastTime,
      isCompleted,
    });

    return this.userProgressRepository.save(newRecord);
  }
}
