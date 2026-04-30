import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ActiveUser } from 'src/auth/decorators/active-user.decorator';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import type { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { CreateFacultyReviewDto } from './dtos/create-faculty-review.dto';
import { FacultyReviewsService } from './providers/faculty-reviews.service';

@Controller('faculty-reviews')
export class FacultyReviewsController {
  constructor(private readonly facultyReviewsService: FacultyReviewsService) {}

  @Auth(AuthType.None)
  @Get('faculty/:facultyId')
  getByFaculty(@Param('facultyId', ParseIntPipe) facultyId: number) {
    return this.facultyReviewsService.getByFaculty(facultyId);
  }

  @Auth(AuthType.None)
  @Get('faculty/:facultyId/summary')
  getSummary(@Param('facultyId', ParseIntPipe) facultyId: number) {
    return this.facultyReviewsService.getSummary(facultyId);
  }

  @Get('faculty/:facultyId/mine')
  getMine(
    @Param('facultyId', ParseIntPipe) facultyId: number,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.facultyReviewsService.getMine(facultyId, user.sub);
  }

  @Get()
  findAll() {
    return this.facultyReviewsService.findAll();
  }

  @Post('faculty/:facultyId')
  upsert(
    @Param('facultyId', ParseIntPipe) facultyId: number,
    @ActiveUser() user: ActiveUserData,
    @Body() createFacultyReviewDto: CreateFacultyReviewDto,
  ) {
    return this.facultyReviewsService.upsert(
      facultyId,
      user.sub,
      createFacultyReviewDto,
    );
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserData,
    @Body() createFacultyReviewDto: CreateFacultyReviewDto,
  ) {
    return this.facultyReviewsService.update(
      id,
      user.sub,
      user.roles,
      createFacultyReviewDto,
    );
  }

  @Delete(':id')
  delete(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.facultyReviewsService.delete(id, user.sub, user.roles);
  }
}
