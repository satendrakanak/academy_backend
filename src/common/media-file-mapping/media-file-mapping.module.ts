import { Global, Module } from '@nestjs/common';
import { MediaFileMappingService } from './providers/media-file-mapping.service';
import { S3Provider } from 'src/uploads/providers/s3.provider';

@Global()
@Module({
  providers: [MediaFileMappingService, S3Provider],
  exports: [MediaFileMappingService],
})
export class MediaFileMappingModule {}
