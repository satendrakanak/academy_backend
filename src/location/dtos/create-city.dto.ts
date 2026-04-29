import { Type } from 'class-transformer';
import { IsString, IsInt, IsNotEmpty } from 'class-validator';

export class CreateCityDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  stateId!: number;
}
