import { PartialType } from '@nestjs/swagger';
import { CreateChapterDto } from './create-chapter.dto';

export class PatchChapterDto extends PartialType(CreateChapterDto) {}
