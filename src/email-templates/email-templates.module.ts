import { Module } from '@nestjs/common';
import { EmailTemplatesService } from './providers/email-templates.service';
import { EmailTemplatesController } from './email-templates.controller';
import { CreateEmailTemplateProvider } from './providers/create-email-template.provider';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailTemplate } from './email-template.entity';
import { PaginationModule } from 'src/common/pagination/pagination.module';
import { UpdateEmailTemplateProvider } from './providers/update-email-template.provider';

@Module({
  imports: [TypeOrmModule.forFeature([EmailTemplate]), PaginationModule],
  providers: [
    EmailTemplatesService,
    CreateEmailTemplateProvider,
    UpdateEmailTemplateProvider,
  ],
  controllers: [EmailTemplatesController],
  exports: [EmailTemplatesService],
})
export class EmailTemplatesModule {}
