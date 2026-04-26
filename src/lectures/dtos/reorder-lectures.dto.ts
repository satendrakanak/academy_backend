import { IsArray, IsInt, IsNotEmpty, ValidateNested } from 'class-validator';

export class ReorderLecturesDto {
  @IsInt()
  @IsNotEmpty()
  id!: number;

  @IsInt()
  @IsNotEmpty()
  position!: number;
}

export class ReorderLecturesArrayDto {
  @IsArray()
  @ValidateNested({ each: true })
  items!: ReorderLecturesDto[];
}
