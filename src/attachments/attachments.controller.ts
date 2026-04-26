import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { AttachmentsService } from './providers/attachments.service';
import { Attachment } from './attachment.entity';
import { CreateAttachmentDto } from './dtos/create-attachment.dto';
import { DeleteRecord } from 'src/common/interfaces/delete-record.interface';

@Controller('attachments')
export class AttachmentsController {
  constructor(
    /**
     * Inject attachmentsService
     */
    private readonly attachmentsService: AttachmentsService,
  ) {}

  @Get()
  async findAll(): Promise<Attachment[]> {
    return await this.attachmentsService.findAll();
  }

  @Get(':id')
  async findOne(id: number): Promise<Attachment> {
    return await this.attachmentsService.findOne(id);
  }

  @Post()
  async create(
    @Body() createAttachmentDto: CreateAttachmentDto,
  ): Promise<Attachment> {
    return await this.attachmentsService.create(createAttachmentDto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<DeleteRecord> {
    return await this.attachmentsService.delete(id);
  }
}
