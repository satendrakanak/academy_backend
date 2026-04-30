import { IsString, MinLength } from 'class-validator';

export class CreateArticleCommentDto {
  @IsString()
  @MinLength(2)
  content!: string;
}
