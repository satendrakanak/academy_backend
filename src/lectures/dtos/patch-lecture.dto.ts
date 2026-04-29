import { PartialType } from '@nestjs/swagger';
import { CreateLectureDto } from './create-lecture.dto';

export class PatchLectureDto extends PartialType(CreateLectureDto) {}
