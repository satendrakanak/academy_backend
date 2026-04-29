import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateLectureProgressDto {
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  lectureId!: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  progress!: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  lastTime!: number;
}
