import { PartialType } from '@nestjs/swagger';
import { CreateCountryDto } from './create-country.dto';

export class PatchCountryDto extends PartialType(CreateCountryDto) {}
