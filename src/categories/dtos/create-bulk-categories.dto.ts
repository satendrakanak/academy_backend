import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { CreateCategoryDto } from './create-category.dto';
import { Type } from 'class-transformer';

export class CreateBulkCategoriesDto {
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateCategoryDto)
  categories: CreateCategoryDto[];
}
