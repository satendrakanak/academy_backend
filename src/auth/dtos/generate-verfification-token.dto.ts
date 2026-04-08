import { PickType } from '@nestjs/swagger';
import { CreateVerficationTokenDto } from './create-verification-token.dto';

export class GenerateVerficationTokenDto extends PickType(
  CreateVerficationTokenDto,
  ['userId', 'type'] as const,
) {}
