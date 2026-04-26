import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class BillingAddressDto {
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(10)
  phoneNumber!: string;

  @IsString()
  @MinLength(5)
  address!: string;

  @IsString()
  country!: string;

  @IsString()
  state!: string;

  @IsString()
  city!: string;

  @IsString()
  pincode!: string;
}
