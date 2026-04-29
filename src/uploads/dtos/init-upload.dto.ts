import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class InitUploadDto {
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @IsNumber()
  @IsPositive()
  size!: number;
}
