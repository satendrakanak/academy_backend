import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsUrl,
  IsEnum,
  Matches,
} from 'class-validator';
import { CategoryType } from '../enums/categoryType.enum';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(96)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(96)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be a valid slug',
  })
  slug: string;

  @IsEnum(CategoryType)
  @IsNotEmpty()
  type: CategoryType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  image?: string;
}
