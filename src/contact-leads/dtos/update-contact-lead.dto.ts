import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ContactLeadStatus } from '../contact-lead.entity';

export class UpdateContactLeadDto {
  @IsOptional()
  @IsEnum(ContactLeadStatus)
  status?: ContactLeadStatus;

  @IsOptional()
  @IsString()
  adminNotes?: string;
}
