import { Injectable, OnModuleInit } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from 'src/settings/providers/settings.service';

type AwsRuntimeSettings = {
  isEnabled: boolean;
  region: string;
  bucketName: string;
  cloudfrontUrl: string;
  accessKeyId: string;
  accessKeySecret: string;
};

@Injectable()
export class S3Provider implements OnModuleInit {
  private client: S3Client;
  private config: AwsRuntimeSettings;

  constructor(
    private readonly configService: ConfigService,
    private readonly settingsService: SettingsService,
  ) {
    this.config = this.getEnvFallback();
    this.client = this.buildClient(this.config);
  }

  async onModuleInit() {
    await this.refreshRuntimeConfig();
  }

  async refreshRuntimeConfig() {
    const nextConfig = await this.settingsService
      .getAwsStorageSettingsForRuntime()
      .catch(() => this.getEnvFallback());

    this.config = {
      ...this.getEnvFallback(),
      ...nextConfig,
    };
    this.client = this.buildClient(this.config);
  }

  async getClient(): Promise<S3Client> {
    await this.refreshRuntimeConfig();
    return this.client;
  }

  async getBucket(): Promise<string> {
    await this.refreshRuntimeConfig();
    return this.config.bucketName;
  }

  getRegion(): string {
    return this.config.region;
  }

  getCloudFrontUrl(): string {
    return this.config.cloudfrontUrl;
  }

  private buildClient(config: AwsRuntimeSettings) {
    return new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.accessKeySecret,
      },
    });
  }

  private getEnvFallback(): AwsRuntimeSettings {
    return {
      isEnabled: false,
      region: this.configService.get<string>('appConfig.awsRegion') || '',
      bucketName:
        this.configService.get<string>('appConfig.awsBucketName') || '',
      cloudfrontUrl:
        this.configService.get<string>('appConfig.awsCloudfrontUrl') || '',
      accessKeyId:
        this.configService.get<string>('appConfig.awsAccessKeyId') || '',
      accessKeySecret:
        this.configService.get<string>('appConfig.awsAccessKeySecret') || '',
    };
  }
}
