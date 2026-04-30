import { Global, Module } from '@nestjs/common';
import { MediaFileMappingService } from './providers/media-file-mapping.service';
import { UploadsModule } from 'src/uploads/uploads.module';

@Global()
@Module({
  imports: [UploadsModule],
  providers: [MediaFileMappingService],
  exports: [MediaFileMappingService],
})
export class MediaFileMappingModule {}
