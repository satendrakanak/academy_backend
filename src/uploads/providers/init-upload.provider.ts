import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Upload } from '../upload.entity';
import { Repository } from 'typeorm';
import { InitUploadDto } from '../dtos/init-upload.dto';
import { UploadStatus } from '../enums/upload-status.enum';
import { S3SignedUrlProvider } from './s3-signed-url.provider';
import {
  generateFileName,
  getDatePath,
  getFileType,
  getFolderFromType,
} from '../utils/file.util';
@Injectable()
export class InitUploadProvider {
  constructor(
    /**
     * Inject s3SignedUrlProvider
     */
    private readonly s3SignedUrlProvider: S3SignedUrlProvider,
    /**
     * Inject uploadRepository
     */

    @InjectRepository(Upload)
    private readonly uploadRepository: Repository<Upload>,
  ) {}
  async initUpload(initUploadDto: InitUploadDto) {
    // ✅ get fileType
    const fileType = getFileType(initUploadDto.mimeType);
    // ✅ decide folder
    const baseFolder = getFolderFromType(fileType);

    // ✅ date structure
    const datePath = getDatePath();

    // ✅ clean filename
    const fileName = generateFileName(initUploadDto.fileName);

    // ✅ final key
    const key = `${baseFolder}/${datePath}/${fileName}`;

    // ✅ DB entry (important)
    const upload = await this.uploadRepository.save({
      name: fileName,
      path: key,
      mime: initUploadDto.mimeType,
      size: initUploadDto.size,
      type: fileType,
      status: UploadStatus.PENDING,
    });

    const { url } = await this.s3SignedUrlProvider.generateUploadUrl(
      key,
      initUploadDto.mimeType,
    );

    return {
      uploadId: upload.id,
      url,
      key,
    };
  }
}
