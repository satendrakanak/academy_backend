import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Lecture } from '../lecture.entity';
import { Repository } from 'typeorm';
import { PatchLectureDto } from '../dtos/patch-lecture.dto';

@Injectable()
export class UpdateLectureProvider {
  constructor(
    /**
     * Inject lectureRepository
     */
    @InjectRepository(Lecture)
    private readonly lectureRepository: Repository<Lecture>,
  ) {}

  async update(id: number, patchLectureDto: PatchLectureDto): Promise<Lecture> {
    const lecture = await this.lectureRepository.findOne({
      where: { id },
      relations: ['chapter', 'video', 'attachments'],
    });

    if (!lecture) {
      throw new NotFoundException('Lecture not found');
    }

    const { chapterId, videoId, isPublished, ...rest } = patchLectureDto;

    // normal fields update
    Object.assign(lecture, rest);

    // course relation handling
    if (chapterId !== undefined) {
      lecture.chapter = { id: chapterId } as Lecture['chapter'];
    }

    // video relation handling
    if (videoId !== undefined) {
      lecture.video = videoId ? ({ id: videoId } as Lecture['video']) : null;
    }

    /**
     * 🔥 PUBLISH VALIDATION
     */
    if (isPublished !== undefined) {
      // 🔥 check content
      const hasVideo = lecture.video?.id;

      const hasAttachments =
        lecture.attachments && lecture.attachments.length > 0;

      if (isPublished && !hasVideo && !hasAttachments) {
        throw new BadRequestException(
          'Lecture must have a video or at least one attachment to be published',
        );
      }

      lecture.isPublished = isPublished;
    }

    return await this.lectureRepository.save(lecture);
  }
}
