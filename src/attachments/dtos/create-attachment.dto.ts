import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateAttachmentDto {
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  lectureId!: number;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  fileId!: number;
}
