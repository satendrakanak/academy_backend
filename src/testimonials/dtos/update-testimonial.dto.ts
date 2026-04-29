import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { TestimonialType } from '../enums/testimonial-type.enum';
import { TestimonialStatus } from '../enums/testimonial-status.enum';

export class UpdateTestimonialDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(TestimonialType)
  type?: TestimonialType;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsString()
  company?: string;

  // 📝 TEXT
  @IsOptional()
  @IsString()
  message?: string;

  // 🎥 VIDEO
  @IsOptional()
  @IsInt()
  videoId?: number;

  @IsOptional()
  @IsInt()
  avatarId?: number | null;

  @IsOptional()
  @IsString()
  avatarAlt?: string;

  // 📚 Course assign
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  courseIds?: number[];

  // ⭐ Rating
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  // 🎯 Featured
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  // ✅ Active
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // 🧠 Status
  @IsOptional()
  @IsEnum(TestimonialStatus)
  status?: TestimonialStatus;

  // 🔢 Priority
  @IsOptional()
  @IsInt()
  priority?: number;
}
