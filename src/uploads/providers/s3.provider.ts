import { Injectable } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Provider {
  private readonly client: S3Client;

  constructor(private readonly configService: ConfigService) {
    this.client = new S3Client({
      region: this.configService.get<string>('appConfig.awsRegion'),
      credentials: {
        accessKeyId: this.configService.get<string>(
          'appConfig.awsAccessKeyId',
        )!,
        secretAccessKey: this.configService.get<string>(
          'appConfig.awsAccessKeySecret',
        )!,
      },
    });
  }

  getClient(): S3Client {
    return this.client;
  }

  getBucket(): string {
    return this.configService.get<string>('appConfig.awsBucketName')!;
  }

  getRegion(): string {
    return this.configService.get<string>('appConfig.awsRegion')!;
  }

  getCloudFrontUrl(): string {
    return this.configService.get<string>('appConfig.awsCloudfrontUrl')!;
  }
}
