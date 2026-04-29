import { IntersectionType } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional } from 'class-validator';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';
import { TestimonialStatus } from '../enums/testimonial-status.enum';
import { TestimonialType } from '../enums/testimonial-type.enum';

class GetTestimonialsBaseDto {
  @IsOptional()
  @IsEnum(TestimonialType)
  type?: TestimonialType;

  @IsOptional()
  @IsEnum(TestimonialStatus)
  status?: TestimonialStatus;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsInt()
  courseId?: number;
}

export class GetTestimonialsDto extends IntersectionType(
  GetTestimonialsBaseDto,
  PaginationQueryDto,
) {}
