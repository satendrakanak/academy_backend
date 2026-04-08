import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsEmpty } from 'class-validator';

export class PatchUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {
  @IsEmpty({ message: 'Password cannot be updated here' })
  password?: never;
}
