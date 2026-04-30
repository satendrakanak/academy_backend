import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class SyncCartItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  courseId!: number;

  @IsOptional()
  @IsString()
  instructor?: string;

  @IsOptional()
  @IsString()
  totalDuration?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  totalLectures?: number;
}

export class SyncCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncCartItemDto)
  items!: SyncCartItemDto[];
}
