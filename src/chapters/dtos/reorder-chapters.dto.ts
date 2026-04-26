import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, ValidateNested } from 'class-validator';

export class ReorderChaptersDto {
  @IsInt()
  @IsNotEmpty()
  id!: number;

  @IsInt()
  @IsNotEmpty()
  position!: number;
}

export class ReorderChaptersArrayDto {
  @IsArray()
  @ValidateNested({ each: true })
  items!: ReorderChaptersDto[];
}
