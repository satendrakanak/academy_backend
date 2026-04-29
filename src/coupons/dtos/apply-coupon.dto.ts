import { IsArray, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class ApplyCouponDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsNumber()
  @Min(0)
  cartTotal!: number;

  @IsArray()
  @IsNumber({}, { each: true })
  courseIds!: number[];
}
