import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { EmailTemplatesService } from './providers/email-templates.service';
import { CreateEmailTemplateDto } from './dtos/create-email-template.dto';
import { GetEmailTemplatesDto } from './dtos/get-email-templates.dto';
import { Paginated } from 'src/common/pagination/interfaces/paginated.interface';
import { EmailTemplate } from './email-template.entity';
import { UpdateEmailTemplateDto } from './dtos/update-email-template.dto';
import { DeleteRecord } from 'src/common/interfaces/delete-record.interface';

@Controller('email-templates')
export class EmailTemplatesController {
  constructor(
    /**
     * Inject emailTemplatesService
     */
    private readonly emailTemplatesService: EmailTemplatesService,
  ) {}

  @Post()
  public async createEmailTemplate(
    @Body() createEmailTemplateDto: CreateEmailTemplateDto,
  ) {
    return await this.emailTemplatesService.create(createEmailTemplateDto);
  }

  @Get()
  public async getEmailTemplates(
    @Query() getEmailTemplatesDto: GetEmailTemplatesDto,
  ): Promise<Paginated<EmailTemplate>> {
    return await this.emailTemplatesService.findAll(getEmailTemplatesDto);
  }

  @Get('by-name')
  public async getEmailTemplateByName(
    @Query('name') name: string,
  ): Promise<EmailTemplate> {
    return await this.emailTemplatesService.getByName(name);
  }
  @Get(':id')
  public async getEmailTemplateById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EmailTemplate> {
    return await this.emailTemplatesService.findOne(id);
  }
  @Patch(':id')
  public async updateEmailtemplate(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmailTemplateDto: UpdateEmailTemplateDto,
  ): Promise<EmailTemplate> {
    return await this.emailTemplatesService.update(id, updateEmailTemplateDto);
  }

  @Delete(':id')
  public async deleteEmailTemplate(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DeleteRecord> {
    await this.emailTemplatesService.softDelete(id);
    return {
      message: 'Email template deleted successfully',
    };
  }

  @Delete(':id/permanent')
  public async permanentDeleteCategory(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DeleteRecord> {
    await this.emailTemplatesService.delete(id);
    return {
      message: 'Email template permanently deleted successfully',
    };
  }

  @Patch(':id/restore')
  public async restoreCategory(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EmailTemplate> {
    return await this.emailTemplatesService.restore(id);
  }
}
