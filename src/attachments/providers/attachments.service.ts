import { Injectable, NotFoundException } from '@nestjs/common';
import { Attachment } from '../attachment.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateAttachmentProvider } from './create-attachment.provider';
import { CreateAttachmentDto } from '../dtos/create-attachment.dto';
import { DeleteRecord } from 'src/common/interfaces/delete-record.interface';

@Injectable()
export class AttachmentsService {
  constructor(
    /**
     * Inject attachmentRepository
     */
    @InjectRepository(Attachment)
    private readonly attachmentRepository: Repository<Attachment>,

    /**
     * Inject createAttachmentProvider
     */
    private readonly createAttachmentProvider: CreateAttachmentProvider,
  ) {}

  async findAll(): Promise<Attachment[]> {
    return await this.attachmentRepository.find();
  }

  async findOne(id: number): Promise<Attachment> {
    const result = await this.attachmentRepository.findOne({
      where: {
        id,
      },
    });

    if (!result) {
      throw new NotFoundException('Attachment not found');
    }

    return result;
  }

  async create(createAttachmentDto: CreateAttachmentDto): Promise<Attachment> {
    return await this.createAttachmentProvider.create(createAttachmentDto);
  }
  async delete(id: number): Promise<DeleteRecord> {
    const result = await this.attachmentRepository.delete(id);

    if (!result.affected) {
      throw new NotFoundException('Attachment not found');
    }
    return {
      message: 'Attachment deleted successfully',
    };
  }
}
