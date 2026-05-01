import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from 'src/courses/course.entity';
import { Enrollment } from 'src/enrollments/enrollment.entity';
import { User } from 'src/users/user.entity';
import { Repository } from 'typeorm';
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
    @InjectRepository(CourseExamAttempt)
    private readonly courseExamAttemptRepository: Repository<CourseExamAttempt>,
  ) {}

  async getForLearner(courseId: number, userId: number) {
    const course = await this.ensureCourseWithExam(courseId);
    await this.ensureEnrolled(courseId, userId);

    const attempts = await this.courseExamAttemptRepository.find({
      where: { course: { id: courseId }, user: { id: userId } },
      order: { attemptNumber: 'DESC', createdAt: 'DESC' },
    });

    const exam = course.exam!;
    const latestAttempt = attempts[0] ? this.mapAttempt(attempts[0]) : null;
    const passedAttempt = attempts.find((attempt) => attempt.passed) || null;
    const attemptsUsed = attempts.length;
    const canAttempt =
      exam.isPublished &&
      (!exam.maxAttempts || attemptsUsed < exam.maxAttempts) &&
      !passedAttempt;

    return {
      exam: this.sanitizeExam(exam),
      attempts: attempts.map((attempt) => this.mapAttempt(attempt)),
      latestAttempt,
      passedAttempt: passedAttempt ? this.mapAttempt(passedAttempt) : null,
      attemptsUsed,
      attemptsRemaining: exam.maxAttempts
        ? Math.max(exam.maxAttempts - attemptsUsed, 0)
        : null,
      canAttempt,
      isPassed: !!passedAttempt,
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

    if (!exam.isPublished) {
      throw new ForbiddenException('Exam is not published yet');
    }

    const existingAttempts = await this.courseExamAttemptRepository.find({
      where: { course: { id: courseId }, user: { id: userId } },
      order: { attemptNumber: 'DESC' },
    });

    if (existingAttempts.some((attempt) => attempt.passed)) {
      throw new BadRequestException('You have already passed this exam');
    }

    if (exam.maxAttempts && existingAttempts.length >= exam.maxAttempts) {
      throw new BadRequestException('Maximum attempts reached for this exam');
    }

    const answerMap = new Map<string, string[]>();
    for (const answer of dto.answers) {
      answerMap.set(answer.questionId, [...new Set(answer.selectedOptionIds)]);
    }

    const snapshot: CourseExamAttemptSnapshot = {
      title: exam.title,
      passingPercentage: exam.passingPercentage,
      questions: exam.questions.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        explanation: question.explanation,
        points: question.points,
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
      const correctOptionIds = question.options
        .filter((option) => option.isCorrect)
        .map((option) => option.id)
        .sort();
      const normalizedSelected = [...selectedOptionIds].sort();
      const isCorrect =
        normalizedSelected.length === correctOptionIds.length &&
        normalizedSelected.every((optionId, index) => optionId === correctOptionIds[index]);
      const earnedPoints = isCorrect ? question.points : 0;

      answers.push({
        questionId: question.id,
        selectedOptionIds,
      });

      questionResults.push({
        questionId: question.id,
        prompt: question.prompt,
        selectedOptionIds,
        correctOptionIds,
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
        options: question.options.map((option) => ({
          id: option.id,
          text: option.text,
        })),
      })),
    };
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
