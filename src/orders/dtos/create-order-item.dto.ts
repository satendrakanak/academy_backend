import { IsInt, Min } from 'class-validator';

export class CreateOrderItemDto {
  @IsInt()
  courseId!: number;

  @IsInt()
  @Min(1)
  quantity!: number;
}
