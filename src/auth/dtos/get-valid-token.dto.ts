import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { TokenType } from '../enums/token-type.enum';

export class GetValidTokenDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsEnum(TokenType)
  @IsNotEmpty()
  type!: TokenType;
}
