import { Injectable } from '@nestjs/common';
import { Chapter } from '../chapter.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateChapterDto } from '../dtos/create-chapter.dto';

@Injectable()
export class CreateChapterProvider {
  constructor(
    /**
     * Inject chapterRepository
     */
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
  ) {}

  async create(createChapterDto: CreateChapterDto): Promise<Chapter> {
    const { courseId, ...rest } = createChapterDto;

    const chapter = this.chapterRepository.create({
      ...rest,

      // relation mapping
      course: { id: courseId },
    });

    return await this.chapterRepository.save(chapter);
  }
}
