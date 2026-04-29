import {
  IsArray,
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
import { TestimonialStatus } from '../enums/testimonial-status.enum';

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
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  courseIds?: number[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsEnum(TestimonialStatus)
  status?: TestimonialStatus;

  @IsOptional()
  @IsInt()
  priority?: number;
}
