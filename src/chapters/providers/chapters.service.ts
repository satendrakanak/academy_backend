import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Chapter } from '../chapter.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateChapterDto } from '../dtos/create-chapter.dto';
import { CreateChapterProvider } from './create-chapter.provider';
import { PatchChapterDto } from '../dtos/patch-chapter.dto';
import { UpdateChapterProvider } from './update-chapter.provider';
import { DeleteRecord } from 'src/common/interfaces/delete-record.interface';
import {
  ReorderChaptersArrayDto,
  ReorderChaptersDto,
} from '../dtos/reorder-chapters.dto';

@Injectable()
export class ChaptersService {
  constructor(
    /**
     * Inject chapterRepository
     */
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    /**
     * Inject createChapterProvider
     */
    private readonly createChapterProvider: CreateChapterProvider,

    /**
     * Inject updateChapterProvider
     */
    private readonly updateChapterProvider: UpdateChapterProvider,
  ) {}

  async findAll(): Promise<Chapter[]> {
    const chapters = await this.chapterRepository.find({
      relations: ['course'],
    });

    return chapters;
  }

  async findOne(id: number): Promise<Chapter> {
    const result = await this.chapterRepository.findOne({
      where: {
        id,
      },
      relations: ['course'],
    });

    if (!result) {
      throw new NotFoundException('Chapter not found');
    }

    return result;
  }
  async create(createChapterDto: CreateChapterDto): Promise<Chapter> {
    return await this.createChapterProvider.create(createChapterDto);
  }

  async update(id: number, patchChapterDto: PatchChapterDto): Promise<Chapter> {
    return await this.updateChapterProvider.update(id, patchChapterDto);
  }

  async reorder(
    reorderChaptersArrayDto: ReorderChaptersArrayDto,
  ): Promise<void> {
    await this.chapterRepository.manager.transaction(async (manager) => {
      for (const item of reorderChaptersArrayDto.items) {
        await manager.update(Chapter, item.id, {
          position: item.position,
        });
      }
    });
  }

  async delete(id: number): Promise<DeleteRecord> {
    const result = await this.chapterRepository.delete(id);

    if (!result.affected) {
      throw new NotFoundException('Chapter not found');
    }
    return {
      message: 'Chapter deleted successfully',
    };
  }
}
