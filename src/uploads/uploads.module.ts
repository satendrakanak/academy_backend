import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './providers/uploads.service';
import { S3Provider } from './providers/s3.provider';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Upload } from './upload.entity';
import { DeleteFileFromS3Provider } from './providers/delete-file-from-s3.provider';
import { S3SignedUrlProvider } from './providers/s3-signed-url.provider';
import { InitUploadProvider } from './providers/init-upload.provider';
import { SettingsModule } from 'src/settings/settings.module';

@Module({
  imports: [TypeOrmModule.forFeature([Upload]), SettingsModule],
  controllers: [UploadsController],
  providers: [
    UploadsService,
    S3Provider,
    DeleteFileFromS3Provider,
    S3SignedUrlProvider,
    InitUploadProvider,
  ],
  exports: [UploadsService, S3Provider],
})
export class UploadsModule {}
