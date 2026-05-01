import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ContactLeadStatus } from '../contact-lead.entity';

export class QueryContactLeadsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ContactLeadStatus)
  status?: ContactLeadStatus;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;
}
