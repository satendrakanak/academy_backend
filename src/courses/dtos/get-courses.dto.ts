import { IntersectionType } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsOptional } from 'class-validator';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';

class GetCoursesBaseDto {
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @IsDate()
  @IsOptional()
  endDate?: Date;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class GetCoursesDto extends IntersectionType(
  GetCoursesBaseDto,
  PaginationQueryDto,
) {}
