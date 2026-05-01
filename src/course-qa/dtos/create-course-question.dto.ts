import { IsString, MinLength } from 'class-validator';

export class CreateCourseQuestionDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(5)
  body!: string;
}
