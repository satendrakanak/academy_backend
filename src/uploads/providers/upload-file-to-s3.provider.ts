import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { S3Provider } from './s3.provider';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import * as path from 'path';
import { v4 as uuid4 } from 'uuid';

@Injectable()
export class UploadFileToS3Provider {
  constructor(
    /**
     * Inject s3Provider
     */
    private readonly s3Provider: S3Provider,
  ) {}
  public async uploadFile(file: Express.Multer.File, folder: string) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    try {
      const s3 = this.s3Provider.getClient();
      const bucket = this.s3Provider.getBucket();
      console.log('BUCKET 👉', bucket);
      const key = `${folder}/${this.generateFileName(file)}`;

      console.log(key);

      const result = await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      console.log('Result', result);

      return key;
    } catch (error) {
      console.log('AWS ERROR 👉', error);
      throw new InternalServerErrorException('Failed to upload file to S3');
    }
  }

  private generateFileName(file: Express.Multer.File) {
    //Extract the file name
    let name = file.originalname.split('.')[0];
    //Remove whitespaces

    name.replace(/\s/g, '').trim();

    //Extract the file extension
    let extension = path.extname(file.originalname);

    //generate timestamp

    let timestamp = new Date().getTime().toString().trim();

    return `${name}-${timestamp}-${uuid4()}${extension}`;
  }
}
