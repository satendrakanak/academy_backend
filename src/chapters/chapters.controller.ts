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
import { ChaptersService } from './providers/chapters.service';
import { Chapter } from './chapter.entity';
import { DeleteRecord } from 'src/common/interfaces/delete-record.interface';
import { CreateChapterDto } from './dtos/create-chapter.dto';
import { PatchChapterDto } from './dtos/patch-chapter.dto';
import { ReorderChaptersArrayDto } from './dtos/reorder-chapters.dto';

@Controller('chapters')
export class ChaptersController {
  constructor(
    /**
     * Inject chaptersService
     */
    private readonly chaptersService: ChaptersService,
  ) {}

  @Get()
  async findAll(): Promise<Chapter[]> {
    return await this.chaptersService.findAll();
  }

  @Get(':id')
  async findOne(id: number): Promise<Chapter> {
    return await this.chaptersService.findOne(id);
  }

  @Post()
  async create(@Body() createChapterDto: CreateChapterDto): Promise<Chapter> {
    return await this.chaptersService.create(createChapterDto);
  }
  @Patch('reorder')
  async reorder(@Body() reorderChaptersArrayDto: ReorderChaptersArrayDto) {
    return this.chaptersService.reorder(reorderChaptersArrayDto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() patchChapterDto: PatchChapterDto,
  ): Promise<Chapter> {
    return await this.chaptersService.update(id, patchChapterDto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<DeleteRecord> {
    return await this.chaptersService.delete(id);
  }
}
