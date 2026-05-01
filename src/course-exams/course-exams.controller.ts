import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ActiveUser } from 'src/auth/decorators/active-user.decorator';
import type { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { UpsertCourseExamAccessOverrideDto } from './dtos/upsert-course-exam-access-override.dto';
import { SubmitCourseExamAttemptDto } from './dtos/submit-course-exam-attempt.dto';
import { CourseExamsService } from './providers/course-exams.service';

@Controller('course-exams')
export class CourseExamsController {
  constructor(private readonly courseExamsService: CourseExamsService) {}

  @Get('my-history')
  getMyHistory(@ActiveUser() user: ActiveUserData) {
    return this.courseExamsService.getMyHistory(user.sub);
  }

  @Get('admin-overview')
  getAdminOverview() {
    return this.courseExamsService.getAdminOverview();
  }

  @Get('admin/users/:userId/access-overrides')
  getUserAccessOverrides(@Param('userId', ParseIntPipe) userId: number) {
    return this.courseExamsService.getUserAccessOverview(userId);
  }

  @Post('admin/users/:userId/access-overrides')
  upsertUserAccessOverride(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: UpsertCourseExamAccessOverrideDto,
  ) {
    return this.courseExamsService.upsertUserAccessOverride(userId, dto);
  }

  @Get('course/:courseId')
  getForLearner(
    @Param('courseId', ParseIntPipe) courseId: number,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.courseExamsService.getForLearner(courseId, user.sub);
  }

  @Post('course/:courseId/attempts')
  submitAttempt(
    @Param('courseId', ParseIntPipe) courseId: number,
    @ActiveUser() user: ActiveUserData,
    @Body() dto: SubmitCourseExamAttemptDto,
  ) {
    return this.courseExamsService.submitAttempt(courseId, user.sub, dto);
  }
}
