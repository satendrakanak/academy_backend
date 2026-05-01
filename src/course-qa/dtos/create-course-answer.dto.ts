import { IsString, MinLength } from 'class-validator';

export class CreateCourseAnswerDto {
  @IsString()
  @MinLength(3)
  body!: string;
}
