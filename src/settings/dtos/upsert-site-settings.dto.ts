import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpsertSiteSettingsDto {
  @IsOptional()
  @IsString()
  siteName?: string;

  @IsOptional()
  @IsString()
  siteTagline?: string;

  @IsOptional()
  @IsString()
  siteDescription?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  footerLogoUrl?: string;

  @IsOptional()
  @IsString()
  faviconUrl?: string;

  @IsOptional()
  @IsString()
  adminPanelName?: string;

  @IsOptional()
  @IsString()
  adminPanelIconUrl?: string;

  @IsOptional()
  @IsString()
  supportEmail?: string;

  @IsOptional()
  @IsString()
  supportPhone?: string;

  @IsOptional()
  @IsString()
  supportAddress?: string;

  @IsOptional()
  @IsString()
  footerAbout?: string;

  @IsOptional()
  @IsString()
  footerCopyright?: string;

  @IsOptional()
  @IsString()
  footerCtaEyebrow?: string;

  @IsOptional()
  @IsString()
  footerCtaHeading?: string;

  @IsOptional()
  @IsString()
  footerCtaDescription?: string;

  @IsOptional()
  @IsString()
  footerPrimaryCtaLabel?: string;

  @IsOptional()
  @IsString()
  footerPrimaryCtaHref?: string;

  @IsOptional()
  @IsString()
  footerSecondaryCtaLabel?: string;

  @IsOptional()
  @IsString()
  footerSecondaryCtaHref?: string;

  @IsOptional()
  @IsString()
  facebookUrl?: string;

  @IsOptional()
  @IsString()
  instagramUrl?: string;

  @IsOptional()
  @IsString()
  youtubeUrl?: string;

  @IsOptional()
  @IsString()
  linkedinUrl?: string;

  @IsOptional()
  @IsString()
  twitterUrl?: string;
}
