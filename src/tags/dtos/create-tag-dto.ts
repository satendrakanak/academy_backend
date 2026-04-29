import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateTagDto {
  @IsNotEmpty()
  @IsString()
  @Length(3, 96)
  name!: string;

  @IsNotEmpty()
  @IsString()
  @Length(3, 96)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be a valid slug',
  })
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
