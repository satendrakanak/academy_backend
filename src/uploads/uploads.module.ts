import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './providers/uploads.service';
import { UploadFileToS3Provider } from './providers/upload-file-to-s3.provider';
import { S3Provider } from './providers/s3.provider';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Upload } from './upload.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Upload])],
  controllers: [UploadsController],
  providers: [UploadsService, UploadFileToS3Provider, S3Provider],
})
export class UploadsModule {}
