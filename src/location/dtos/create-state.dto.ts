import { Type } from 'class-transformer';
import { IsString, IsInt, IsNotEmpty } from 'class-validator';

export class CreateStateDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  countryId!: number;
}
