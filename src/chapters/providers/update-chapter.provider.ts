import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Chapter } from '../chapter.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PatchChapterDto } from '../dtos/patch-chapter.dto';

@Injectable()
export class UpdateChapterProvider {
  constructor(
    /**
     * Inject chapterRepository
     */
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
  ) {}

  async update(id: number, patchChapterDto: PatchChapterDto): Promise<Chapter> {
    const chapter = await this.chapterRepository.findOne({
      where: { id },
      relations: ['course', 'lectures'],
    });

    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    const { courseId, isPublished, ...rest } = patchChapterDto;

    // normal fields update
    Object.assign(chapter, rest);

    // course relation handling
    if (courseId !== undefined) {
      chapter.course = { id: courseId } as Chapter['course'];
    }
    /**
     * 🔥 PUBLISH VALIDATION
     */
    if (isPublished !== undefined) {
      const hasPublishedLecture = chapter.lectures?.some(
        (lecture) => lecture.isPublished,
      );

      if (isPublished && !hasPublishedLecture) {
        throw new BadRequestException(
          'Chapter must have at least one published lecture to be published',
        );
      }

      chapter.isPublished = isPublished;
    }

    return await this.chapterRepository.save(chapter);
  }
}
