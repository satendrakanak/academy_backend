import { IsArray, ArrayNotEmpty, IsString, Length } from 'class-validator';

export class CreateManyTagsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @Length(1, 96, { each: true })
  names!: string[];
}
