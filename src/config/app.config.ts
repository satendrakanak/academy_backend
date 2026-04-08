import { registerAs } from '@nestjs/config';

export default registerAs('appConfig', () => ({
  environment: process.env.NODE_ENV || 'production',
  appUrl: process.env.APP_URL,
  appPort: process.env.APP_PORT,
  fronEndUrl: process.env.FRONT_END_URL,
  apiVersion: process.env.API_VERSION,
  awsBucketName: process.env.AWS_PUBLIC_BUCKET_NAME,
  awsRegion: process.env.AWS_REGION,
  awsCloudfrontUrl: process.env.AWS_CLOUDFRONT_URL,
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsAccessKeySecret: process.env.AWS_ACCESS_KEY_SECRET,
  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT,
  smtpUser: process.env.SMTP_USER,
  smtpPassword: process.env.SMTP_PASSWORD,
  smtpMailEncryption: process.env.SMTP_MAIL_ENCRYPTION,
  smtpFromName: process.env.SMTP_FROM_NAME,
  smtpFromEmail: process.env.SMTP_FROM_EMAIL,
  redisHost: process.env.REDIS_HOST,
  redisPort: process.env.REDIS_PORT,
}));
