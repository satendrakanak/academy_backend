import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateContactLeadDto {
  @IsString()
  @MaxLength(140)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  subject?: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  pageUrl?: string;
}
