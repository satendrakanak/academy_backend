import { IsArray, IsNumber, Min } from 'class-validator';

export class AutoApplyCouponDto {
  @IsNumber()
  @Min(0)
  cartTotal!: number;

  @IsArray()
  @IsNumber({}, { each: true })
  courseIds!: number[];
}
