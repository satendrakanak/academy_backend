import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateEmailTemplateProvider } from './create-email-template.provider';
import { CreateEmailTemplateDto } from '../dtos/create-email-template.dto';
import { EmailTemplate } from '../email-template.entity';
import { GetEmailTemplatesDto } from '../dtos/get-email-templates.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationProvider } from 'src/common/pagination/providers/pagination.provider';
import { Paginated } from 'src/common/pagination/interfaces/paginated.interface';
import { DeleteRecord } from 'src/common/interfaces/delete-record.interface';
import { UpdateEmailTemplateProvider } from './update-email-template.provider';
import { UpdateEmailTemplateDto } from '../dtos/update-email-template.dto';

@Injectable()
export class EmailTemplatesService {
  constructor(
    /**
     * Inject emailTemplateRepository
     */
    @InjectRepository(EmailTemplate)
    private readonly emailTemplateRepository: Repository<EmailTemplate>,

    /**
     * Inject createEmailTemplateProvider
     */
    private readonly createEmailTemplateProvider: CreateEmailTemplateProvider,

    /**
     * Inject updateEmailTemplateProvider
     */
    private readonly updateEmailTemplateProvider: UpdateEmailTemplateProvider,

    /**
     * Inject paginatedProvider
     */

    private readonly paginationProvider: PaginationProvider,
  ) {}

  public async findAll(
    getEmailTemplatesDto: GetEmailTemplatesDto,
  ): Promise<Paginated<EmailTemplate>> {
    return await this.paginationProvider.paginateQuery(
      {
        limit: getEmailTemplatesDto.limit,
        page: getEmailTemplatesDto.page,
      },
      this.emailTemplateRepository,
    );
  }

  public async findOne(id: number): Promise<EmailTemplate> {
    const emailTemplate = await this.emailTemplateRepository.findOneBy({
      id,
    });

    if (!emailTemplate) {
      throw new NotFoundException('Email template not found');
    }

    return emailTemplate;
  }
  public async getByName(name: string): Promise<EmailTemplate> {
    console.log('Main yahan AAya');
    const emailTemplate = await this.emailTemplateRepository.findOne({
      where: { templateName: name },
    });

    if (!emailTemplate) {
      throw new NotFoundException('Email template not found');
    }

    return emailTemplate;
  }
  public async create(
    createEmailTemplateDto: CreateEmailTemplateDto,
  ): Promise<EmailTemplate> {
    return await this.createEmailTemplateProvider.create(
      createEmailTemplateDto,
    );
  }

  public async update(
    id: number,
    updateEmailTemplateDto: UpdateEmailTemplateDto,
  ): Promise<EmailTemplate> {
    return await this.updateEmailTemplateProvider.update(id, {
      ...updateEmailTemplateDto,
    });
  }

  public async delete(id: number): Promise<DeleteRecord> {
    const result = await this.emailTemplateRepository.delete(id);

    if (!result.affected) {
      throw new NotFoundException('Email template not found');
    }
    return {
      message: 'Email template deleted successfully',
    };
  }

  public async softDelete(id: number): Promise<DeleteRecord> {
    const result = await this.emailTemplateRepository.softDelete(id);

    if (!result.affected) {
      throw new NotFoundException('Email template not found');
    }

    return {
      message: 'Email template deleted successfully',
    };
  }

  public async restore(id: number): Promise<EmailTemplate> {
    const emailTemplate = await this.emailTemplateRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!emailTemplate) {
      throw new NotFoundException('Email template not found');
    }

    if (!emailTemplate.deletedAt) {
      throw new BadRequestException('Email template is not deleted');
    }

    const result = await this.emailTemplateRepository.restore(id);

    if (!result.affected) {
      throw new InternalServerErrorException(
        'Failed to restore email template',
      );
    }
    const restoredEmailTemplate = await this.emailTemplateRepository.findOneBy({
      id,
    });

    return restoredEmailTemplate!;
  }
}
