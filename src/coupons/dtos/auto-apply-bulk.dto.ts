import { IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

class CourseItemDto {
  @IsNumber()
  id!: number;

  @IsNumber()
  @Min(0)
  price!: number;
}

export class AutoApplyBulkCouponDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CourseItemDto)
  courses!: CourseItemDto[];
}
