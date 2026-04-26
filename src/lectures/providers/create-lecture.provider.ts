import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Lecture } from '../lecture.entity';
import { Repository } from 'typeorm';
import { CreateLectureDto } from '../dtos/create-lecture.dto';

@Injectable()
export class CreateLectureProvider {
  constructor(
    /**
     * Inject lectureRepository
     */
    @InjectRepository(Lecture)
    private readonly lectureRepository: Repository<Lecture>,
  ) {}
  async create(createLectureDto: CreateLectureDto): Promise<Lecture> {
    const { chapterId, videoId, ...rest } = createLectureDto;

    const chapter = this.lectureRepository.create({
      ...rest,

      // relation mapping
      chapter: { id: chapterId },

      ...(videoId && {
        video: { id: videoId },
      }),
    });

    return await this.lectureRepository.save(chapter);
  }
}
