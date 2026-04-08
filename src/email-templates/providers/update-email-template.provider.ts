import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UpdateEmailTemplateDto } from '../dtos/update-email-template.dto';
import { EmailTemplate } from '../email-template.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UpdateEmailTemplateProvider {
  constructor(
    /**
     * Inject emailTemplateRepository
     */
    @InjectRepository(EmailTemplate)
    private readonly emailTemplateRepository: Repository<EmailTemplate>,
  ) {}
  public async update(
    id: number,
    updateEmailTemplateDto: UpdateEmailTemplateDto,
  ): Promise<EmailTemplate> {
    try {
      const emailTemplate = await this.emailTemplateRepository.findOneBy({
        id,
      });
      if (!emailTemplate) {
        throw new NotFoundException('Email template not found');
      }
      Object.assign(emailTemplate, updateEmailTemplateDto);

      return await this.emailTemplateRepository.save(emailTemplate);
    } catch (error) {
      throw new InternalServerErrorException('Failed to create email template');
    }
  }
}
