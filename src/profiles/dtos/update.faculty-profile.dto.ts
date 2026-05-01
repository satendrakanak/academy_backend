import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class UpdateFacultyProfileDto {
  @IsString()
  @IsOptional()
  expertise!: string;

  @IsString()
  @IsOptional()
  experience!: string;

  @IsString()
  @IsOptional()
  designation!: string;

  @IsUrl()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  linkedin!: string;

  @IsUrl()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  instagram!: string;

  @IsUrl()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  twitter!: string;

  @IsUrl()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  youtube!: string;
}
