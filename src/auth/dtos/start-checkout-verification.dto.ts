import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class StartCheckoutVerificationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(96)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(96)
  lastName!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  phoneNumber!: string;
}
