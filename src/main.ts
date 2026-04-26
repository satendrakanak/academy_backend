import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use('/orders/webhook', express.raw({ type: '*/*' }));
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  /* Configure Swagger */
  const configService = app.get(ConfigService);

  const appUrl = `${configService.get('appConfig.appUrl')}/${configService.get('appConfig.appPort')}`;

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Unitus Backend App API')
    .setDescription(`Use the API base url ${appUrl}`)
    .setTermsOfService(appUrl)
    .setLicense('MIT', appUrl)
    .addServer(appUrl)
    .setVersion(configService.get('appConfig.apiVersion') as string)
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  //Add useGlobal Interceptors

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // enable CORS
  app.enableCors({
    origin: 'http://localhost:3000', // 🔥 exact frontend
    credentials: true, // 🔥 MUST
  });

  await app.listen(process.env.APP_PORT ?? 8000);
}
bootstrap();
