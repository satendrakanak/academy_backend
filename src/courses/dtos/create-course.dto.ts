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
  IsEnum,
  IsNumber,
  Min,
  ArrayMinSize,
} from 'class-validator';

class CourseFaqItemDto {
  @IsString()
  @IsNotEmpty()
  question!: string;

  @IsString()
  @IsNotEmpty()
  answer!: string;
}

class CourseExamQuestionOptionDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  text!: string;

  @IsBoolean()
  isCorrect!: boolean;
}

const COURSE_EXAM_QUESTION_TYPES = ['single', 'multiple', 'true_false'] as const;

class CourseExamQuestionDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  prompt!: string;

  @IsString()
  @IsEnum(COURSE_EXAM_QUESTION_TYPES)
  type!: 'single' | 'multiple' | 'true_false';

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  points!: number;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CourseExamQuestionOptionDto)
  options!: CourseExamQuestionOptionDto[];
}

class CourseExamDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  passingPercentage!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxAttempts!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  timeLimitMinutes?: number;

  @IsBoolean()
  showResultImmediately!: boolean;

  @IsBoolean()
  isPublished!: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CourseExamQuestionDto)
  questions!: CourseExamQuestionDto[];
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

  @IsOptional()
  @ValidateNested()
  @Type(() => CourseExamDto)
  exam?: CourseExamDto;
}
