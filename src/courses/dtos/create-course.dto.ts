import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumberString,
  Length,
  Matches,
  IsInt,
  IsArray,
  ValidateNested,
} from 'class-validator';

class CourseFaqItemDto {
  @IsString()
  @IsNotEmpty()
  question!: string;

  @IsString()
  @IsNotEmpty()
  answer!: string;
}

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 255)
  title!: string;

  @IsString()
  @IsOptional()
  @Length(3, 255)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be a valid slug',
  })
  slug!: string;

  @IsString()
  @IsOptional()
  shortDescription?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @Length(3, 60)
  metaTitle?: string;

  @IsString()
  @IsOptional()
  @Length(3, 100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Meta Slug must be a valid slug',
  })
  metaSlug?: string;

  @IsString()
  @IsOptional()
  metaDescription?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  imageId?: number;

  @IsString()
  @IsOptional()
  @Length(3, 96)
  imageAlt?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  videoId?: number;

  @IsBoolean()
  @IsOptional()
  isFree?: boolean;

  @IsNumberString()
  @IsOptional()
  priceInr?: string;

  @IsNumberString()
  @IsOptional()
  priceUsd?: string;

  @IsString()
  @IsOptional()
  duration?: string;

  @IsString()
  @IsOptional()
  mode?: string;

  @IsString()
  @IsOptional()
  certificate?: string;

  @IsString()
  @IsOptional()
  exams?: string;

  @IsString()
  @IsOptional()
  experienceLevel?: string;

  @IsString()
  @IsOptional()
  studyMaterial?: string;

  @IsString()
  @IsOptional()
  additionalBook?: string;

  @IsString()
  @IsOptional()
  language?: string;

  @IsString()
  @IsOptional()
  technologyRequirements?: string;

  @IsString()
  @IsOptional()
  eligibilityRequirements?: string;

  @IsString()
  @IsOptional()
  disclaimer?: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  categories?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  tags?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  facultyIds?: number[];

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CourseFaqItemDto)
  faqs?: CourseFaqItemDto[];
}
