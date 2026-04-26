import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsUrl,
  IsEnum,
  Matches,
  Length,
  IsInt,
} from 'class-validator';
import { CategoryType } from '../enums/categoryType.enum';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 96)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 96)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be a valid slug',
  })
  slug!: string;

  @IsEnum(CategoryType)
  @IsNotEmpty()
  type!: CategoryType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  imageId?: number;

  @IsString()
  @IsOptional()
  imageAlt?: string;
}
