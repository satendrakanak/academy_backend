import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactLead } from './contact-lead.entity';
import { ContactLeadsController } from './contact-leads.controller';
import { ContactLeadsService } from './providers/contact-leads.service';

@Module({
  imports: [TypeOrmModule.forFeature([ContactLead])],
  controllers: [ContactLeadsController],
  providers: [ContactLeadsService],
})
export class ContactLeadsModule {}
