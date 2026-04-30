import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ActiveUser } from 'src/auth/decorators/active-user.decorator';
import type { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { CourseQaService } from './providers/course-qa.service';
import { CreateCourseAnswerDto } from './dtos/create-course-answer.dto';
import { CreateCourseQuestionDto } from './dtos/create-course-question.dto';

@Controller('course-qa')
export class CourseQaController {
  constructor(private readonly courseQaService: CourseQaService) {}

  @Get('course/:courseId')
  getByCourse(
    @Param('courseId', ParseIntPipe) courseId: number,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.courseQaService.getByCourse(courseId, user.sub);
  }

  @Get('questions')
  findAllQuestions() {
    return this.courseQaService.findAllQuestions();
  }

  @Get('answers')
  findAllAnswers() {
    return this.courseQaService.findAllAnswers();
  }

  @Post('course/:courseId/questions')
  createQuestion(
    @Param('courseId', ParseIntPipe) courseId: number,
    @ActiveUser() user: ActiveUserData,
    @Body() createCourseQuestionDto: CreateCourseQuestionDto,
  ) {
    return this.courseQaService.createQuestion(
      courseId,
      user.sub,
      createCourseQuestionDto,
    );
  }

  @Post('questions/:questionId/answers')
  createAnswer(
    @Param('questionId', ParseIntPipe) questionId: number,
    @ActiveUser() user: ActiveUserData,
    @Body() createCourseAnswerDto: CreateCourseAnswerDto,
  ) {
    return this.courseQaService.createAnswer(
      questionId,
      user.sub,
      createCourseAnswerDto,
    );
  }

  @Patch('answers/:answerId/accept')
  acceptAnswer(
    @Param('answerId', ParseIntPipe) answerId: number,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.courseQaService.acceptAnswer(answerId, user.sub);
  }

  @Patch('questions/:questionId')
  updateQuestion(
    @Param('questionId', ParseIntPipe) questionId: number,
    @ActiveUser() user: ActiveUserData,
    @Body() createCourseQuestionDto: CreateCourseQuestionDto,
  ) {
    return this.courseQaService.updateQuestion(
      questionId,
      user.sub,
      user.roles,
      createCourseQuestionDto,
    );
  }

  @Patch('answers/:answerId')
  updateAnswer(
    @Param('answerId', ParseIntPipe) answerId: number,
    @ActiveUser() user: ActiveUserData,
    @Body() createCourseAnswerDto: CreateCourseAnswerDto,
  ) {
    return this.courseQaService.updateAnswer(
      answerId,
      user.sub,
      user.roles,
      createCourseAnswerDto,
    );
  }

  @Delete('questions/:questionId')
  deleteQuestion(
    @Param('questionId', ParseIntPipe) questionId: number,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.courseQaService.deleteQuestion(questionId, user.sub, user.roles);
  }

  @Delete('answers/:answerId')
  deleteAnswer(
    @Param('answerId', ParseIntPipe) answerId: number,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.courseQaService.deleteAnswer(answerId, user.sub, user.roles);
  }

  @Patch('questions/:questionId/publish')
  setQuestionPublished(
    @Param('questionId', ParseIntPipe) questionId: number,
    @Query('isPublished') isPublished = 'true',
  ) {
    return this.courseQaService.setQuestionPublished(
      questionId,
      isPublished === 'true',
    );
  }

  @Patch('answers/:answerId/publish')
  setAnswerPublished(
    @Param('answerId', ParseIntPipe) answerId: number,
    @Query('isPublished') isPublished = 'true',
  ) {
    return this.courseQaService.setAnswerPublished(
      answerId,
      isPublished === 'true',
    );
  }
}
