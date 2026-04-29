import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Attachment } from '../attachment.entity';
import { Repository } from 'typeorm';
import { CreateAttachmentDto } from '../dtos/create-attachment.dto';

@Injectable()
export class CreateAttachmentProvider {
  constructor(
    /**
     * Inject attachmentRepository
     */
    @InjectRepository(Attachment)
    private readonly attachmentRepository: Repository<Attachment>,
  ) {}

  async create(createAttachmentDto: CreateAttachmentDto): Promise<Attachment> {
    const { lectureId, fileId, ...rest } = createAttachmentDto;
    const attachment = this.attachmentRepository.create({
      ...rest,

      // relation mapping
      lecture: { id: lectureId },

      ...(fileId && {
        file: { id: fileId },
      }),
    });

    return await this.attachmentRepository.save(attachment);
  }
}
