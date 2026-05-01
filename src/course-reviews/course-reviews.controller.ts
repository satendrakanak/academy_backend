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
import { Auth } from 'src/auth/decorators/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import type { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { CreateCourseReviewDto } from './dtos/create-course-review.dto';
import { CourseReviewsService } from './providers/course-reviews.service';

@Controller('course-reviews')
export class CourseReviewsController {
  constructor(private readonly courseReviewsService: CourseReviewsService) {}

  @Auth(AuthType.None)
  @Get('course/:courseId')
  getByCourse(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.courseReviewsService.getByCourse(courseId);
  }

  @Auth(AuthType.None)
  @Get('course/:courseId/summary')
  getSummary(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.courseReviewsService.getSummary(courseId);
  }

  @Get('course/:courseId/mine')
  getMine(
    @Param('courseId', ParseIntPipe) courseId: number,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.courseReviewsService.getMine(courseId, user.sub);
  }

  @Get()
  findAll() {
    return this.courseReviewsService.findAll();
  }

  @Post('course/:courseId')
  upsert(
    @Param('courseId', ParseIntPipe) courseId: number,
    @ActiveUser() user: ActiveUserData,
    @Body() createCourseReviewDto: CreateCourseReviewDto,
  ) {
    return this.courseReviewsService.upsert(
      courseId,
      user.sub,
      createCourseReviewDto,
    );
  }

  @Delete(':id')
  delete(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.courseReviewsService.delete(id, user.sub, user.roles);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserData,
    @Body() createCourseReviewDto: CreateCourseReviewDto,
  ) {
    return this.courseReviewsService.update(
      id,
      user.sub,
      user.roles,
      createCourseReviewDto,
    );
  }

  @Patch(':id/publish')
  setPublished(
    @Param('id', ParseIntPipe) id: number,
    @Query('isPublished') isPublished = 'true',
  ) {
    return this.courseReviewsService.setPublished(id, isPublished === 'true');
  }
}
