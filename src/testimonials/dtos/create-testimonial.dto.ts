import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { TestimonialType } from '../enums/testimonial-type.enum';

export class CreateTestimonialDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsEnum(TestimonialType)
  type?: TestimonialType;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  message?: string;

  @IsOptional()
  @IsInt()
  videoId?: number;

  @IsOptional()
  @IsInt()
  avatarId?: number | null;

  @IsOptional()
  @IsString()
  avatarAlt?: string;

  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  courseId?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}
