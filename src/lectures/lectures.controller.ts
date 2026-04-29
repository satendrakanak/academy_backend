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
import { LecturesService } from './providers/lectures.service';
import { Lecture } from './lecture.entity';
import { CreateLectureDto } from './dtos/create-lecture.dto';
import { ReorderLecturesArrayDto } from './dtos/reorder-lectures.dto';
import { PatchLectureDto } from './dtos/patch-lecture.dto';
import { DeleteRecord } from 'src/common/interfaces/delete-record.interface';

@Controller('lectures')
export class LecturesController {
  constructor(
    /**
     * Inject lecturesService
     */
    private readonly lecturesService: LecturesService,
  ) {}

  @Get()
  async findAll(): Promise<Lecture[]> {
    return await this.lecturesService.findAll();
  }

  @Get(':id')
  async findOne(id: number): Promise<Lecture> {
    return await this.lecturesService.findOne(id);
  }

  @Post()
  async create(@Body() createLectureDto: CreateLectureDto): Promise<Lecture> {
    return await this.lecturesService.create(createLectureDto);
  }
  @Patch('reorder')
  async reorder(@Body() reorderLecturesArrayDto: ReorderLecturesArrayDto) {
    return this.lecturesService.reorder(reorderLecturesArrayDto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() patchLectureDto: PatchLectureDto,
  ): Promise<Lecture> {
    return await this.lecturesService.update(id, patchLectureDto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<DeleteRecord> {
    return await this.lecturesService.delete(id);
  }
}
