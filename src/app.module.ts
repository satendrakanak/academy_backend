import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { CategoriesModule } from './categories/categories.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlugModule } from './common/slug/slug.module';
import { PaginationModule } from './common/pagination/pagination.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import environmentValidation from './config/environment.validation';
import jwtConfig from './auth/config/jwt.config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AccessTokenGuard } from './auth/guards/access-token/access-token.guard';
import { AuthenticationGuard } from './auth/guards/authentication/authentication.guard';
import { DataResponseInterceptor } from './common/interceptors/data-response/data-response.interceptor';
import { UploadsModule } from './uploads/uploads.module';
import { MailModule } from './mail/mail.module';
import { EmailTemplatesModule } from './email-templates/email-templates.module';
import { BullModule } from '@nestjs/bullmq';
import { TagsModule } from './tags/tags.module';
import { ChaptersModule } from './chapters/chapters.module';
import { MediaFileMappingModule } from './common/media-file-mapping/media-file-mapping.module';
import { LecturesModule } from './lectures/lectures.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { UserProgressModule } from './user-progress/user-progress.module';
import { LocationModule } from './location/location.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { SettingsModule } from './settings/settings.module';
import { CryptoModule } from './common/crypto/crypto.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { CouponsModule } from './coupons/coupons.module';
import { RolesPermissionsModule } from './roles-permissions/roles-permissions.module';
import { ProfilesModule } from './profiles/profiles.module';
import { ArticlesModule } from './articles/articles.module';
import { TestimonialsModule } from './testimonials/testimonials.module';
import { CertificatesModule } from './certificates/certificates.module';
import { CourseReviewsModule } from './course-reviews/course-reviews.module';
import { ArticleCommentsModule } from './article-comments/article-comments.module';
import { CourseQaModule } from './course-qa/course-qa.module';
import { CartsModule } from './carts/carts.module';
import { FacultyReviewsModule } from './faculty-reviews/faculty-reviews.module';
import { ContactLeadsModule } from './contact-leads/contact-leads.module';

const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: !ENV ? '.env' : `.env.${ENV}`,
      load: [appConfig, databaseConfig],
      validationSchema: environmentValidation,
    }),
    UsersModule,
    CoursesModule,
    CategoriesModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        synchronize: configService.get('database.synchronize'),
        autoLoadEntities: configService.get('database.autoLoadEntities'),
        host: configService.get('database.host'),
        port: +configService.get('database.port'),
        username: configService.get('database.user'),
        password: configService.get('database.password'),
        database: configService.get('database.name'),
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('appConfig.redisHost'),
          port: configService.get<number>('appConfig.redisPort'),
        },
      }),
    }),
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    SlugModule,
    PaginationModule,
    AuthModule,
    UploadsModule,
    MailModule,
    EmailTemplatesModule,
    TagsModule,
    ChaptersModule,
    MediaFileMappingModule,
    LecturesModule,
    AttachmentsModule,
    UserProgressModule,
    LocationModule,
    OrdersModule,
    PaymentsModule,
    SettingsModule,
    CryptoModule,
    EnrollmentsModule,
    CouponsModule,
    RolesPermissionsModule,
    ProfilesModule,
    ArticlesModule,
    TestimonialsModule,
    CertificatesModule,
    CourseReviewsModule,
    ArticleCommentsModule,
    CourseQaModule,
    CartsModule,
    FacultyReviewsModule,
    ContactLeadsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: DataResponseInterceptor,
    },
    AccessTokenGuard,
  ],
})
export class AppModule {}
