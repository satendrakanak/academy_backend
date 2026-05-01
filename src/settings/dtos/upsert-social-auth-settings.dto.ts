import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { SocialProvider } from '../enums/social-provider.enum';

export class SocialAuthProviderDto {
  @IsEnum(SocialProvider)
  provider!: SocialProvider;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  clientSecret?: string;

  @IsOptional()
  @IsString()
  redirectUrl?: string;
}

export class UpsertSocialAuthSettingsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialAuthProviderDto)
  providers!: SocialAuthProviderDto[];
}
