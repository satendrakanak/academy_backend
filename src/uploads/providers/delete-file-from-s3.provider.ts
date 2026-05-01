import { Injectable } from '@nestjs/common';
import { S3Provider } from './s3.provider';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class DeleteFileFromS3Provider {
  constructor(
    /**
     * Inject s3Provider
     */
    private readonly s3Provider: S3Provider,
  ) {}

  async deleteFile(key: string) {
    try {
      const s3 = await this.s3Provider.getClient();
      const bucketName = await this.s3Provider.getBucket();
      await s3.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: key,
        }),
      );
    } catch (error) {
      throw new Error('Failed to delete file from S3');
    }
  }
}
