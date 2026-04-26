import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { UserProgressService } from './providers/user-progress.service';
import type { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { UpdateLectureProgressDto } from './dtos/update-lecture-progress.dto';
import { ActiveUser } from 'src/auth/decorators/active-user.decorator';

@Controller('user-progress')
export class UserProgressController {
  constructor(
    /**
     * Inject userProgressService
     */
    private readonly userProgressService: UserProgressService,
  ) {}

  @Get('lecture/:lectureId')
  async getLectureProgress(
    @ActiveUser() user: ActiveUserData,
    @Param('lectureId', ParseIntPipe) lectureId: number,
  ) {
    return this.userProgressService.getLectureProgress(user, lectureId);
  }

  // ✅ FULL COURSE
  @Get('course/:courseId')
  async getCourseProgress(
    @ActiveUser() user: ActiveUserData,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.userProgressService.getCourseProgress(user, courseId);
  }

  @Post('update')
  async updateLectureProgress(
    @ActiveUser() user: ActiveUserData,
    @Body() updateLectureProgressDto: UpdateLectureProgressDto,
  ) {
    return await this.userProgressService.updateLectureProgress(
      user,
      updateLectureProgressDto,
    );
  }
}
