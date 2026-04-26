import { PartialType } from '@nestjs/swagger';
import { CreateStateDto } from './create-state.dto';

export class PatchStateDto extends PartialType(CreateStateDto) {}
