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
import { CoursesService } from './providers/courses.service';
import { CreateCourseDto } from './dtos/create-course.dto';
import { ActiveUser } from 'src/auth/decorators/active-user.decorator';
import type { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { PatchCourseDto } from './dtos/patch-course.dto';
import { Course } from './course.entity';
import { GetCoursesDto } from './dtos/get-courses.dto';
import { Paginated } from 'src/common/pagination/interfaces/paginated.interface';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';

@Controller('courses')
export class CoursesController {
  constructor(
    /**
     * Inject coursesService
     */

    private readonly coursesService: CoursesService,
  ) {}

  @Auth(AuthType.Optional)
  @Get()
  public async getCourses(
    @Query() getCoursesDto: GetCoursesDto,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Paginated<Course> | Course[]> {
    return await this.coursesService.findAll(getCoursesDto, user);
  }

  @Auth(AuthType.Optional)
  @Get('featured')
  async getFeaturedCourses(@ActiveUser() user: ActiveUserData) {
    return await this.coursesService.getFeaturedCourses(user);
  }

  @Auth(AuthType.Optional)
  @Get('related/:id')
  async getRelatedCourses(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserData,
  ) {
    return await this.coursesService.getRelatedCourses(id, user);
  }

  @Auth(AuthType.Optional)
  @Get('slug/:slug')
  public async getCourseBySlug(
    @Param('slug') slug: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Course> {
    return await this.coursesService.findOneBySlug(slug, user);
  }
  @Get('learn/:slug/')
  async getCourseForLearning(
    @Param('slug') slug: string,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.coursesService.findCourseForLearning(slug, user);
  }

  @Get('enrolled/:userId')
  async getEnrolledCourses(
    @Param('userId', ParseIntPipe) userId: number,
    @ActiveUser() user: ActiveUserData,
  ) {
    return await this.coursesService.getEnrolledCourses(userId, user);
  }

  @Auth(AuthType.None)
  @Get(':id')
  public async getCourseById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Course> {
    return await this.coursesService.findOneById(id);
  }

  @Post()
  public async createCourse(
    @ActiveUser() user: ActiveUserData,
    @Body() createCourseDto: CreateCourseDto,
  ): Promise<Course> {
    return await this.coursesService.create(createCourseDto, user);
  }

  @Patch(':id')
  public async updateCourse(
    @Param('id', ParseIntPipe) id: number,
    @Body() patchCourseDto: PatchCourseDto,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Course> {
    return await this.coursesService.update(id, patchCourseDto, user);
  }

  @Delete(':id')
  public async deleteCourse(@Param('id', ParseIntPipe) id: number) {
    return await this.coursesService.delete(id);
  }
}
