import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { UploadFileToS3Provider } from './upload-file-to-s3.provider';
import { UploadFile } from '../interfaces/upload-file.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Upload } from '../upload.entity';
import { Repository } from 'typeorm';
import { S3Provider } from './s3.provider';
import { detectFileType, getFolder } from '../utils/file.util';

@Injectable()
export class UploadsService {
  constructor(
    /**
     * Inject uploadRepository
     */

    @InjectRepository(Upload)
    private readonly uploadRepository: Repository<Upload>,

    /**
    /**
     * Inject s3Provider
     */
    private readonly s3Provider: S3Provider,
    /**
     * Inject uploadFileToS3Provider
     */

    private readonly uploadFileToS3Provider: UploadFileToS3Provider,
  ) {}

  public async uploadFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    try {
      // upload file to aws s3
      const type = detectFileType(file.mimetype);
      const folder = getFolder(type);
      const name = await this.uploadFileToS3Provider.uploadFile(file, folder);
      // generate to a new entry in the database

      const uploadFile: UploadFile = {
        name,
        path: `https://${this.s3Provider.getCloudFrontUrl()}/${name}`,
        type,
        mime: file.mimetype,
        size: file.size,
      };
      const upload = this.uploadRepository.create(uploadFile);
      return await this.uploadRepository.save(upload);
    } catch (error) {
      throw new ConflictException(error);
    }
  }
}
