import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MediaFileMappingService } from 'src/common/media-file-mapping/providers/media-file-mapping.service';
import { Course } from 'src/courses/course.entity';
import { Enrollment } from 'src/enrollments/enrollment.entity';
import { User } from 'src/users/user.entity';
import { Repository } from 'typeorm';
import { CourseAnswer } from '../course-answer.entity';
import { CourseQuestion } from '../course-question.entity';
import { CreateCourseAnswerDto } from '../dtos/create-course-answer.dto';
import { CreateCourseQuestionDto } from '../dtos/create-course-question.dto';

@Injectable()
export class CourseQaService {
  constructor(
    @InjectRepository(CourseQuestion)
    private readonly courseQuestionRepository: Repository<CourseQuestion>,
    @InjectRepository(CourseAnswer)
    private readonly courseAnswerRepository: Repository<CourseAnswer>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    private readonly mediaFileMappingService: MediaFileMappingService,
  ) {}

  async getByCourse(courseId: number, userId: number) {
    await this.ensureEnrolled(courseId, userId);

    const questions = await this.courseQuestionRepository.find({
      where: [
        { course: { id: courseId }, isPublished: true },
        { course: { id: courseId }, user: { id: userId } },
      ],
      relations: [
        'user',
        'user.avatar',
        'answers',
        'answers.user',
        'answers.user.avatar',
      ],
      order: { createdAt: 'DESC', answers: { createdAt: 'ASC' } },
    });

    return questions.map((question) => ({
      ...this.mapQuestionMedia(question),
      answers: (question.answers || []).filter(
        (answer) => answer.isPublished || answer.user.id === userId,
      ).map((answer) => this.mapAnswerMedia(answer)),
    }));
  }

  async findAllQuestions() {
    const questions = await this.courseQuestionRepository.find({
      relations: [
        'course',
        'course.image',
        'user',
        'user.avatar',
        'answers',
        'answers.user',
        'answers.user.avatar',
      ],
      order: { createdAt: 'DESC', answers: { createdAt: 'ASC' } },
    });

    return questions.map((question) => this.mapQuestionMedia(question));
  }

  async findAllAnswers() {
    const answers = await this.courseAnswerRepository.find({
      relations: ['question', 'question.course', 'user', 'user.avatar'],
      order: { createdAt: 'DESC' },
    });

    return answers.map((answer) => this.mapAnswerMedia(answer));
  }

  async createQuestion(
    courseId: number,
    userId: number,
    createCourseQuestionDto: CreateCourseQuestionDto,
  ) {
    const [course, user] = await Promise.all([
      this.courseRepository.findOne({ where: { id: courseId } }),
      this.userRepository.findOne({ where: { id: userId } }),
      this.ensureEnrolled(courseId, userId),
    ]);

    if (!course) throw new NotFoundException('Course not found');
    if (!user) throw new NotFoundException('User not found');

    const question = this.courseQuestionRepository.create({
      course,
      user,
      title: createCourseQuestionDto.title.trim(),
      body: createCourseQuestionDto.body.trim(),
    });

    const saved = await this.courseQuestionRepository.save(question);
    return this.mapQuestionMedia(saved);
  }

  async createAnswer(
    questionId: number,
    userId: number,
    createCourseAnswerDto: CreateCourseAnswerDto,
  ) {
    const [question, user] = await Promise.all([
      this.courseQuestionRepository.findOne({
        where: { id: questionId },
        relations: ['course'],
      }),
      this.userRepository.findOne({ where: { id: userId } }),
    ]);

    if (!question) throw new NotFoundException('Question not found');
    if (!user) throw new NotFoundException('User not found');

    await this.ensureEnrolled(question.course.id, userId);

    const answer = this.courseAnswerRepository.create({
      question,
      user,
      body: createCourseAnswerDto.body.trim(),
    });

    const saved = await this.courseAnswerRepository.save(answer);
    return this.mapAnswerMedia(saved);
  }

  async setQuestionPublished(id: number, isPublished: boolean) {
    const question = await this.courseQuestionRepository.findOne({
      where: { id },
      relations: ['course', 'user', 'user.avatar', 'answers'],
    });

    if (!question) throw new NotFoundException('Question not found');

    question.isPublished = isPublished;
    const saved = await this.courseQuestionRepository.save(question);
    return this.mapQuestionMedia(saved);
  }

  async setAnswerPublished(id: number, isPublished: boolean) {
    const answer = await this.courseAnswerRepository.findOne({
      where: { id },
      relations: ['question', 'question.course', 'user', 'user.avatar'],
    });

    if (!answer) throw new NotFoundException('Answer not found');

    answer.isPublished = isPublished;
    const saved = await this.courseAnswerRepository.save(answer);
    return this.mapAnswerMedia(saved);
  }

  async updateQuestion(
    id: number,
    userId: number,
    roles: string[],
    createCourseQuestionDto: CreateCourseQuestionDto,
  ) {
    const question = await this.courseQuestionRepository.findOne({
      where: { id },
      relations: ['course', 'user', 'user.avatar', 'answers'],
    });

    if (!question) throw new NotFoundException('Question not found');
    if (!this.canManage(question.user.id, userId, roles)) {
      throw new ForbiddenException('You can edit only your own question');
    }

    question.title = createCourseQuestionDto.title.trim();
    question.body = createCourseQuestionDto.body.trim();
    question.isPublished = roles.includes('admin') ? question.isPublished : false;
    const saved = await this.courseQuestionRepository.save(question);
    return this.mapQuestionMedia(saved);
  }

  async updateAnswer(
    id: number,
    userId: number,
    roles: string[],
    createCourseAnswerDto: CreateCourseAnswerDto,
  ) {
    const answer = await this.courseAnswerRepository.findOne({
      where: { id },
      relations: ['question', 'question.course', 'user', 'user.avatar'],
    });

    if (!answer) throw new NotFoundException('Answer not found');
    if (!this.canManage(answer.user.id, userId, roles)) {
      throw new ForbiddenException('You can edit only your own answer');
    }

    answer.body = createCourseAnswerDto.body.trim();
    answer.isPublished = roles.includes('admin') ? answer.isPublished : false;
    const saved = await this.courseAnswerRepository.save(answer);
    return this.mapAnswerMedia(saved);
  }

  async deleteQuestion(id: number, userId: number, roles: string[]) {
    const question = await this.courseQuestionRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!question) throw new NotFoundException('Question not found');
    if (!this.canManage(question.user.id, userId, roles)) {
      throw new ForbiddenException('You can delete only your own question');
    }

    await this.courseQuestionRepository.softDelete(id);
    return { message: 'Question deleted successfully' };
  }

  async deleteAnswer(id: number, userId: number, roles: string[]) {
    const answer = await this.courseAnswerRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!answer) throw new NotFoundException('Answer not found');
    if (!this.canManage(answer.user.id, userId, roles)) {
      throw new ForbiddenException('You can delete only your own answer');
    }

    await this.courseAnswerRepository.softDelete(id);
    return { message: 'Answer deleted successfully' };
  }

  async acceptAnswer(answerId: number, userId: number) {
    const answer = await this.courseAnswerRepository.findOne({
      where: { id: answerId },
      relations: ['question', 'question.user', 'question.answers'],
    });

    if (!answer) throw new NotFoundException('Answer not found');
    if (answer.question.user.id !== userId) {
      throw new ForbiddenException('Only question owner can accept an answer');
    }

    await this.courseAnswerRepository.update(
      { question: { id: answer.question.id } },
      { isAccepted: false },
    );
    answer.isAccepted = true;
    answer.question.isResolved = true;
    await this.courseQuestionRepository.save(answer.question);
    const saved = await this.courseAnswerRepository.save(answer);
    return this.mapAnswerMedia(saved);
  }

  private async ensureEnrolled(courseId: number, userId: number) {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { course: { id: courseId }, user: { id: userId } },
    });

    if (!enrollment) {
      throw new ForbiddenException('Only enrolled users can access course Q&A');
    }

    return enrollment;
  }

  private canManage(ownerId: number, userId: number, roles: string[] = []) {
    return ownerId === userId || roles.includes('admin');
  }

  private mapQuestionMedia(question: CourseQuestion) {
    if (question.user?.avatar) {
      question.user.avatar = this.mediaFileMappingService.mapFile(
        question.user.avatar,
      );
    }

    if (question.course?.image) {
      question.course.image = this.mediaFileMappingService.mapFile(
        question.course.image,
      );
    }

    question.answers = (question.answers || []).map((answer) =>
      this.mapAnswerMedia(answer),
    );

    return question;
  }

  private mapAnswerMedia(answer: CourseAnswer) {
    if (answer.user?.avatar) {
      answer.user.avatar = this.mediaFileMappingService.mapFile(
        answer.user.avatar,
      );
    }

    if (answer.question?.course?.image) {
      answer.question.course.image = this.mediaFileMappingService.mapFile(
        answer.question.course.image,
      );
    }

    return answer;
  }
}
