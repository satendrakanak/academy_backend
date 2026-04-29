import { PartialType } from '@nestjs/swagger';
import { CreateCityDto } from './create-city.dto';

export class PatchCityDto extends PartialType(CreateCityDto) {}
