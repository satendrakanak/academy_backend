import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Certificate } from 'src/certificates/certificate.entity';
import { Course } from 'src/courses/course.entity';
import { Enrollment } from 'src/enrollments/enrollment.entity';
import { Lecture } from 'src/lectures/lecture.entity';
import { UserProgres } from 'src/user-progress/user-progres.entity';
import { User } from 'src/users/user.entity';
import { Repository } from 'typeorm';
import { CourseExamAccessOverride } from '../course-exam-access-override.entity';
import { UpsertCourseExamAccessOverrideDto } from '../dtos/upsert-course-exam-access-override.dto';
import { SubmitCourseExamAttemptDto } from '../dtos/submit-course-exam-attempt.dto';
import {
  CourseExamAttempt,
  CourseExamAttemptAnswer,
  CourseExamAttemptQuestionResult,
  CourseExamAttemptSnapshot,
} from '../course-exam-attempt.entity';

@Injectable()
export class CourseExamsService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Lecture)
    private readonly lectureRepository: Repository<Lecture>,
    @InjectRepository(UserProgres)
    private readonly userProgressRepository: Repository<UserProgres>,
    @InjectRepository(Certificate)
    private readonly certificateRepository: Repository<Certificate>,
    @InjectRepository(CourseExamAccessOverride)
    private readonly courseExamAccessOverrideRepository: Repository<CourseExamAccessOverride>,
    @InjectRepository(CourseExamAttempt)
    private readonly courseExamAttemptRepository: Repository<CourseExamAttempt>,
  ) {}

  async getMyHistory(userId: number) {
    const attempts = await this.courseExamAttemptRepository.find({
      where: { user: { id: userId } },
      relations: ['course'],
      order: { submittedAt: 'DESC', createdAt: 'DESC' },
    });

    const grouped = new Map<
      number,
      {
        course: { id: number; title: string; slug: string };
        attemptsCount: number;
        bestScore: number;
        latestScore: number;
        latestMaxScore: number;
        latestPercentage: number;
        passed: boolean;
        lastAttemptedAt: Date | null;
      }
    >();

    for (const attempt of attempts) {
      const existing = grouped.get(attempt.course.id);
      const percentage = Number(attempt.percentage);

      if (!existing) {
        grouped.set(attempt.course.id, {
          course: {
            id: attempt.course.id,
            title: attempt.course.title,
            slug: attempt.course.slug,
          },
          attemptsCount: 1,
          bestScore: percentage,
          latestScore: attempt.score,
          latestMaxScore: attempt.maxScore,
          latestPercentage: percentage,
          passed: attempt.passed,
          lastAttemptedAt: attempt.submittedAt || attempt.createdAt,
        });
        continue;
      }

      existing.attemptsCount += 1;
      existing.bestScore = Math.max(existing.bestScore, percentage);
      existing.passed = existing.passed || attempt.passed;
    }

    return Array.from(grouped.values()).sort((a, b) => {
      const left = new Date(a.lastAttemptedAt || 0).getTime();
      const right = new Date(b.lastAttemptedAt || 0).getTime();
      return right - left;
    });
  }

  async getAdminOverview() {
    const [attempts, certificatesIssued] = await Promise.all([
      this.courseExamAttemptRepository.find({
        relations: ['course', 'user'],
        order: { submittedAt: 'DESC', createdAt: 'DESC' },
      }),
      this.certificateRepository.count(),
    ]);

    const totalAttempts = attempts.length;
    const uniqueLearners = new Set(
      attempts.map((attempt) => attempt.user?.id).filter(Boolean),
    ).size;
    const passedAttempts = attempts.filter((attempt) => attempt.passed).length;
    const averageScore = totalAttempts
      ? Math.round(
          attempts.reduce(
            (sum, attempt) => sum + Number(attempt.percentage || 0),
            0,
          ) / totalAttempts,
        )
      : 0;
    const passRate = totalAttempts
      ? Math.round((passedAttempts / totalAttempts) * 100)
      : 0;

    const courseMap = new Map<
      number,
      {
        courseId: number;
        courseTitle: string;
        attempts: number;
        passCount: number;
        totalPercentage: number;
      }
    >();

    for (const attempt of attempts) {
      const existing = courseMap.get(attempt.course.id) || {
        courseId: attempt.course.id,
        courseTitle: attempt.course.title,
        attempts: 0,
        passCount: 0,
        totalPercentage: 0,
      };

      existing.attempts += 1;
      existing.passCount += attempt.passed ? 1 : 0;
      existing.totalPercentage += Number(attempt.percentage || 0);
      courseMap.set(attempt.course.id, existing);
    }

    return {
      totalAttempts,
      uniqueLearners,
      passedAttempts,
      certificatesIssued,
      averageScore,
      passRate,
      recentAttempts: attempts.slice(0, 6).map((attempt) => ({
        id: attempt.id,
        learnerName:
          `${attempt.user?.firstName || ''} ${attempt.user?.lastName || ''}`.trim() ||
          attempt.user?.email ||
          'Learner',
        courseTitle: attempt.course?.title || 'Course',
        score: attempt.score,
        maxScore: attempt.maxScore,
        percentage: Number(attempt.percentage || 0),
        passed: attempt.passed,
        submittedAt: attempt.submittedAt,
      })),
      topCourses: Array.from(courseMap.values())
        .map((item) => ({
          courseId: item.courseId,
          courseTitle: item.courseTitle,
          attempts: item.attempts,
          passCount: item.passCount,
          averageScore: Math.round(item.totalPercentage / item.attempts),
        }))
        .sort((a, b) => b.attempts - a.attempts || b.averageScore - a.averageScore)
        .slice(0, 6),
    };
  }

  async getUserAccessOverview(userId: number) {
    const enrollments = await this.enrollmentRepository.find({
      where: { user: { id: userId }, isActive: true },
      relations: ['course'],
      order: { enrolledAt: 'DESC' },
    });

    const overrides = await this.courseExamAccessOverrideRepository.find({
      where: { user: { id: userId } },
      relations: ['course'],
    });

    const overrideMap = new Map(
      overrides.map((override) => [override.course.id, override]),
    );

    const rows = await Promise.all(
      enrollments
        .filter((enrollment) => enrollment.course?.exam?.questions?.length)
        .map(async (enrollment) => {
          const course = enrollment.course;
          const override = overrideMap.get(course.id);
          const attemptsUsed = await this.courseExamAttemptRepository.count({
            where: {
              user: { id: userId },
              course: { id: course.id },
            },
          });
          const passed = await this.courseExamAttemptRepository.exists({
            where: {
              user: { id: userId },
              course: { id: course.id },
              passed: true,
            },
          });
          const baseAttempts = Number(course.exam?.maxAttempts || 0);
          const extraAttempts = Number(override?.extraAttempts || 0);
          const effectiveAttempts = baseAttempts + extraAttempts;

          return {
            courseId: course.id,
            courseTitle: course.title,
            courseSlug: course.slug,
            baseAttempts,
            extraAttempts,
            effectiveAttempts,
            attemptsUsed,
            remainingAttempts: Math.max(effectiveAttempts - attemptsUsed, 0),
            passed,
            note: override?.note || '',
          };
        }),
    );

    return rows;
  }

  async upsertUserAccessOverride(
    userId: number,
    dto: UpsertCourseExamAccessOverrideDto,
  ) {
    const course = await this.courseRepository.findOne({
      where: { id: dto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (!course.exam?.questions?.length) {
      throw new BadRequestException('Selected course does not have a final exam');
    }

    const enrollment = await this.enrollmentRepository.findOne({
      where: { user: { id: userId }, course: { id: dto.courseId }, isActive: true },
    });

    if (!enrollment) {
      throw new BadRequestException('User is not actively enrolled in this course');
    }

    let override = await this.courseExamAccessOverrideRepository.findOne({
      where: { user: { id: userId }, course: { id: dto.courseId } },
      relations: ['course', 'user'],
    });

    if (!override) {
      override = this.courseExamAccessOverrideRepository.create({
        user: { id: userId } as User,
        course: { id: dto.courseId } as Course,
      });
    }

    override.extraAttempts = dto.extraAttempts;
    override.note = dto.note?.trim() || null;

    await this.courseExamAccessOverrideRepository.save(override);
    return this.getUserAccessOverview(userId);
  }

  async getForLearner(courseId: number, userId: number) {
    const course = await this.ensureCourseWithExam(courseId);
    await this.ensureEnrolled(courseId, userId);

    const attempts = await this.courseExamAttemptRepository.find({
      where: { course: { id: courseId }, user: { id: userId } },
      order: { attemptNumber: 'DESC', createdAt: 'DESC' },
    });
    const unlockState = await this.getUnlockState(courseId, userId);

    const exam = course.exam!;
    const latestAttempt = attempts[0] ? this.mapAttempt(attempts[0]) : null;
    const passedAttempt = attempts.find((attempt) => attempt.passed) || null;
    const attemptsUsed = attempts.length;
    const attemptLimit = await this.getEffectiveAttemptLimit(courseId, userId, exam);
    const canAttempt =
      exam.isPublished &&
      unlockState.isUnlocked &&
      (attemptLimit === null || attemptsUsed < attemptLimit) &&
      !passedAttempt;

    return {
      exam: this.sanitizeExam(exam),
      attempts: attempts.map((attempt) => this.mapAttempt(attempt)),
      latestAttempt,
      passedAttempt: passedAttempt ? this.mapAttempt(passedAttempt) : null,
      attemptsUsed,
      attemptsRemaining:
        attemptLimit === null ? null : Math.max(attemptLimit - attemptsUsed, 0),
      canAttempt,
      isPassed: !!passedAttempt,
      isUnlocked: unlockState.isUnlocked,
      unlockProgress: unlockState.progress,
      unlockMessage: unlockState.message,
    };
  }

  async submitAttempt(
    courseId: number,
    userId: number,
    dto: SubmitCourseExamAttemptDto,
  ) {
    const course = await this.ensureCourseWithExam(courseId);
    await this.ensureEnrolled(courseId, userId);

    const exam = course.exam!;
    const unlockState = await this.getUnlockState(courseId, userId);

    if (!exam.isPublished) {
      throw new ForbiddenException('Exam is not published yet');
    }

    if (!unlockState.isUnlocked) {
      throw new ForbiddenException(unlockState.message);
    }

    const existingAttempts = await this.courseExamAttemptRepository.find({
      where: { course: { id: courseId }, user: { id: userId } },
      order: { attemptNumber: 'DESC' },
    });

    if (existingAttempts.some((attempt) => attempt.passed)) {
      throw new BadRequestException('You have already passed this exam');
    }

    const attemptLimit = await this.getEffectiveAttemptLimit(courseId, userId, exam);

    if (attemptLimit !== null && existingAttempts.length >= attemptLimit) {
      throw new BadRequestException('Maximum attempts reached for this exam');
    }

    const answerMap = new Map<string, string[]>();
    const answerTextMap = new Map<string, string>();
    for (const answer of dto.answers) {
      answerMap.set(answer.questionId, [...new Set(answer.selectedOptionIds)]);
      answerTextMap.set(answer.questionId, answer.answerText?.trim() || '');
    }

    const snapshot: CourseExamAttemptSnapshot = {
      title: exam.title,
      passingPercentage: exam.passingPercentage,
      questions: exam.questions.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        type: question.type,
        explanation: question.explanation,
        points: question.points,
        acceptedAnswers: question.acceptedAnswers,
        options: question.options.map((option) => ({
          id: option.id,
          text: option.text,
          isCorrect: option.isCorrect,
        })),
      })),
    };

    const answers: CourseExamAttemptAnswer[] = [];
    const questionResults: CourseExamAttemptQuestionResult[] = [];
    let score = 0;
    let maxScore = 0;

    for (const question of exam.questions) {
      const selectedOptionIds = answerMap.get(question.id) || [];
      const answerText = answerTextMap.get(question.id) || '';
      const correctOptionIds =
        question.type === 'drag_drop'
          ? question.options.map((option) => option.id)
          : question.options
              .filter((option) => option.isCorrect)
              .map((option) => option.id)
              .sort();
      const normalizedSelected = [...selectedOptionIds].sort();
      const acceptedAnswers = (question.acceptedAnswers || [])
        .map((answer) => answer.trim().toLowerCase())
        .filter(Boolean);
      let isCorrect = false;

      if (question.type === 'short_text') {
        isCorrect = acceptedAnswers.includes(answerText.trim().toLowerCase());
      } else if (question.type === 'drag_drop') {
        isCorrect =
          selectedOptionIds.length === question.options.length &&
          selectedOptionIds.every(
            (optionId, index) => optionId === question.options[index]?.id,
          );
      } else {
        isCorrect =
          normalizedSelected.length === correctOptionIds.length &&
          normalizedSelected.every(
            (optionId, index) => optionId === correctOptionIds[index],
          );
      }
      const earnedPoints = isCorrect ? question.points : 0;

      answers.push({
        questionId: question.id,
        selectedOptionIds,
        answerText,
      });

      questionResults.push({
        questionId: question.id,
        prompt: question.prompt,
        selectedOptionIds,
        correctOptionIds,
        answerText,
        acceptedAnswers: question.type === 'short_text' ? acceptedAnswers : undefined,
        isCorrect,
        earnedPoints,
        totalPoints: question.points,
        explanation: question.explanation,
      });

      score += earnedPoints;
      maxScore += question.points;
    }

    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    const passed = percentage >= exam.passingPercentage;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const attempt = await this.courseExamAttemptRepository.save(
      this.courseExamAttemptRepository.create({
        course,
        user,
        attemptNumber: existingAttempts.length + 1,
        answers,
        questionResults,
        examSnapshot: snapshot,
        score,
        maxScore,
        percentage: percentage.toFixed(2),
        passed,
        submittedAt: new Date(),
      }),
    );

    return this.mapAttempt(attempt);
  }

  async hasPassedExam(userId: number, courseId: number) {
    const attempt = await this.courseExamAttemptRepository.findOne({
      where: {
        user: { id: userId },
        course: { id: courseId },
        passed: true,
      },
      order: { attemptNumber: 'DESC' },
    });

    return !!attempt;
  }

  private async ensureCourseWithExam(courseId: number) {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (!course.exam?.questions?.length) {
      throw new NotFoundException('Exam not configured for this course');
    }

    return course;
  }

  private async ensureEnrolled(courseId: number, userId: number) {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { course: { id: courseId }, user: { id: userId }, isActive: true },
    });

    if (!enrollment) {
      throw new ForbiddenException('Only enrolled learners can access this exam');
    }

    return enrollment;
  }

  private sanitizeExam(exam: NonNullable<Course['exam']>) {
    return {
      ...exam,
      questions: exam.questions.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        type: question.type,
        points: question.points,
        explanation: question.explanation,
        acceptedAnswers:
          question.type === 'short_text' ? question.acceptedAnswers : undefined,
        options: question.options.map((option) => ({
          id: option.id,
          text: option.text,
        })),
      })),
    };
  }

  private async getUnlockState(courseId: number, userId: number) {
    const totalLectures = await this.lectureRepository.count({
      where: {
        isPublished: true,
        chapter: {
          course: { id: courseId },
        },
      },
      relations: ['chapter', 'chapter.course'],
    });

    if (!totalLectures) {
      return {
        isUnlocked: false,
        progress: 0,
        message: 'Final exam will unlock once course lectures are published.',
      };
    }

    const completedLectures = await this.userProgressRepository
      .createQueryBuilder('progress')
      .innerJoin('progress.lecture', 'lecture')
      .innerJoin('lecture.chapter', 'chapter')
      .where('progress.userId = :userId', { userId })
      .andWhere('chapter.courseId = :courseId', { courseId })
      .andWhere('progress.isCompleted = true')
      .andWhere('lecture.isPublished = true')
      .getCount();

    const progress = Math.min(
      100,
      Math.round((completedLectures / totalLectures) * 100),
    );

    return {
      isUnlocked: completedLectures >= totalLectures,
      progress,
      message:
        completedLectures >= totalLectures
          ? 'Final exam is now unlocked.'
          : `Complete all course lectures before attempting the final exam. Current progress: ${progress}%.`,
    };
  }

  private async getEffectiveAttemptLimit(
    courseId: number,
    userId: number,
    exam: NonNullable<Course['exam']>,
  ) {
    const override = await this.courseExamAccessOverrideRepository.findOne({
      where: { user: { id: userId }, course: { id: courseId } },
    });

    const baseAttempts = Number(exam.maxAttempts || 0);
    const extraAttempts = Number(override?.extraAttempts || 0);

    return baseAttempts > 0 ? baseAttempts + extraAttempts : null;
  }

  private mapAttempt(attempt: CourseExamAttempt) {
    return {
      id: attempt.id,
      attemptNumber: attempt.attemptNumber,
      score: attempt.score,
      maxScore: attempt.maxScore,
      percentage: Number(attempt.percentage),
      passed: attempt.passed,
      submittedAt: attempt.submittedAt,
      createdAt: attempt.createdAt,
      questionResults: attempt.questionResults,
    };
  }
}
