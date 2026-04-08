import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EmailTemplate } from '../email-template.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateEmailTemplateDto } from '../dtos/create-email-template.dto';

@Injectable()
export class CreateEmailTemplateProvider {
  constructor(
    /**
     * Inject emailTemplateRepository
     */
    @InjectRepository(EmailTemplate)
    private readonly emailTemplateRepository: Repository<EmailTemplate>,
  ) {}

  public async create(
    createEmailTemplateDto: CreateEmailTemplateDto,
  ): Promise<EmailTemplate> {
    try {
      const emailTemplate = this.emailTemplateRepository.create(
        createEmailTemplateDto,
      );
      return await this.emailTemplateRepository.save(emailTemplate);
    } catch (error) {
      throw new InternalServerErrorException('Failed to create email template');
    }
  }
}
