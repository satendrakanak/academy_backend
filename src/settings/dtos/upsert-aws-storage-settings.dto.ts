import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpsertAwsStorageSettingsDto {
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  bucketName?: string;

  @IsOptional()
  @IsString()
  cloudfrontUrl?: string;

  @IsOptional()
  @IsString()
  accessKeyId?: string;

  @IsOptional()
  @IsString()
  accessKeySecret?: string;
}
