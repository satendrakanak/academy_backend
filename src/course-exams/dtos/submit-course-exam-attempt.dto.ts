import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';

class SubmitCourseExamAnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @IsArray()
  @IsString({ each: true })
  selectedOptionIds!: string[];
}

export class SubmitCourseExamAttemptDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubmitCourseExamAnswerDto)
  answers!: SubmitCourseExamAnswerDto[];
}
