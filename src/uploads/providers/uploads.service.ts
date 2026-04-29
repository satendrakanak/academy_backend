import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Upload } from '../upload.entity';
import { Repository } from 'typeorm';
import { DeleteFileFromS3Provider } from './delete-file-from-s3.provider';
import { InitUploadDto } from '../dtos/init-upload.dto';
import { InitUploadProvider } from './init-upload.provider';
import { UploadStatus } from '../enums/upload-status.enum';
import { MediaFileMappingService } from 'src/common/media-file-mapping/providers/media-file-mapping.service';

@Injectable()
export class UploadsService {
  constructor(
    /**
     * Inject uploadRepository
     */

    @InjectRepository(Upload)
    private readonly uploadRepository: Repository<Upload>,

    /**
     * Inject deleteFileFromS3Provider
     */

    private readonly deleteFileFromS3Provider: DeleteFileFromS3Provider,

    /**
     * Inject initUploadProvider
     */
    private readonly initUploadProvider: InitUploadProvider,

    /**
     * Inject mediaFileMappingService
     */

    private readonly mediaFileMappingService: MediaFileMappingService,
  ) {}

  async getUploads(): Promise<Upload[]> {
    const uploads = await this.uploadRepository.find({
      where: {
        status: UploadStatus.COMPLETED,
      },
      order: {
        createdAt: 'DESC',
      },
    });
    return uploads.map((item) => this.mediaFileMappingService.mapFile(item));
  }

  async getOneById(id: number): Promise<Upload> {
    const result = await this.uploadRepository.findOneBy({
      id,
    });

    if (!result) {
      throw new BadRequestException('Media not found');
    }
    return this.mediaFileMappingService.mapFile(result);
  }

  async delete(id: number) {
    const file = await this.uploadRepository.findOne({
      where: { id },
    });

    if (!file) {
      throw new BadRequestException('File not found');
    }

    try {
      await this.deleteFileFromS3Provider.deleteFile(file.path);
      await this.uploadRepository.delete(id);

      return {
        message: 'File deleted successfully',
      };
    } catch (error: unknown) {
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      }

      throw new BadRequestException('Failed to delete file');
    }
  }

  async initUpload(initUploadDto: InitUploadDto) {
    return await this.initUploadProvider.initUpload(initUploadDto);
  }

  async confirmUpload(uploadId: number): Promise<Upload> {
    const upload = await this.uploadRepository.findOneBy({ id: uploadId });

    if (!upload) {
      throw new BadRequestException('Upload not found');
    }

    upload.status = UploadStatus.COMPLETED;

    const saved = await this.uploadRepository.save(upload);

    return this.mediaFileMappingService.mapFile(saved);
  }
}
