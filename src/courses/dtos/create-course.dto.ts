import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumberString,
  Length,
  Matches,
} from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 255)
  title: string;

  @IsString()
  @IsOptional()
  @Length(3, 255)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be a valid slug',
  })
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsNumberString()
  @IsNotEmpty()
  priceInr: string;

  @IsNumberString()
  @IsOptional()
  priceUsd?: string;

  @IsString()
  @IsOptional()
  duration?: string;

  @IsString()
  @IsOptional()
  mode?: string;

  @IsBoolean()
  @IsOptional()
  certificate?: boolean;

  @IsString()
  @IsOptional()
  exams?: string;

  @IsString()
  @IsOptional()
  @Length(1, 50)
  experienceLevel?: string;

  @IsString()
  @IsOptional()
  studyMaterial?: string;

  @IsString()
  @IsOptional()
  additionalBook?: string;

  @IsString()
  @IsOptional()
  @Length(1, 50)
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
}
