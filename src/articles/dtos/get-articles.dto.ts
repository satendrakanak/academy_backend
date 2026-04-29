import { IntersectionType } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsOptional } from 'class-validator';
import { PaginationQueryDto } from 'src/common/pagination/dtos/pagination-query.dto';

class GetArticlesBaseDto {
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

export class GetArticlesDto extends IntersectionType(
  GetArticlesBaseDto,
  PaginationQueryDto,
) {}
