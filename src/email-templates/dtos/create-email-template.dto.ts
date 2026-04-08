import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateEmailTemplateDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  templateName!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(2048)
  subject!: string;

  @IsString()
  @IsNotEmpty()
  body!: string;
}
