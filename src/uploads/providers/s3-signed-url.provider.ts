import { Injectable } from '@nestjs/common';
import { S3Provider } from './s3.provider';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3SignedUrlProvider {
  constructor(
    /**
     * Inject s3Provider
     */
    private readonly s3Provider: S3Provider,
  ) {}

  async generateUploadUrl(key: string, mimeType: string) {
    const s3 = await this.s3Provider.getClient();
    const bucket = await this.s3Provider.getBucket();

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: mimeType,
    });

    const signedUrl = await getSignedUrl(s3, command, {
      expiresIn: 60 * 5,
    });

    return {
      url: signedUrl,
    };
  }
}
