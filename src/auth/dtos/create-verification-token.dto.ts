import { IsDate, IsEnum, IsInt, IsNotEmpty, IsString } from 'class-validator';
import { TokenType } from '../enums/token-type.enum';
import { Type } from 'class-transformer';

export class CreateVerficationTokenDto {
  @IsInt()
  @Type(() => Number)
  userId!: number;

  @IsNotEmpty()
  @IsString()
  token!: string;

  @IsEnum(TokenType)
  @IsNotEmpty()
  type!: TokenType;

  @IsDate()
  @Type(() => Date)
  expiresAt!: Date;
}
