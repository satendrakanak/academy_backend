import { Body, Controller, Post } from '@nestjs/common';
import { CoursesService } from './providers/courses.service';
import { CreateCourseDto } from './dtos/create-course.dto';
import { ActiveUser } from 'src/auth/decorators/active-user.decorator';
import type { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';

@Controller('courses')
export class CoursesController {
  constructor(
    /**
     * Inject coursesService
     */

    private readonly coursesService: CoursesService,
  ) {}

  @Post()
  public async createCourse(
    @ActiveUser() user: ActiveUserData,
    @Body() createCourseDto: CreateCourseDto,
  ) {
    return await this.coursesService.create(createCourseDto, user);
  }
}
