import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './providers/auth.service';
import { BcryptProvider } from './providers/bcrypt.provider';
import { HashingProvider } from './providers/hashing.provider';
import { UsersModule } from 'src/users/users.module';
import { SignInProvider } from './providers/sign-in.provider';
import { GenerateTokensProvider } from './providers/generate-tokens.provider';
import { ConfigModule } from '@nestjs/config';
import jwtConfig from './config/jwt.config';
import { JwtModule } from '@nestjs/jwt';
import { RefreshTokensProvider } from './providers/refresh-tokens.provider';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationToken } from './verification-token.entity';
import { GenerateVerificationTokenProvider } from './providers/generate-verification-token.provider';
import { VerifyEmailProvider } from './providers/verify-email.provider';
import { VerificationTokenService } from './providers/verification-token.service';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    TypeOrmModule.forFeature([VerificationToken]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    BcryptProvider,
    {
      provide: HashingProvider,
      useClass: BcryptProvider,
    },
    SignInProvider,
    GenerateTokensProvider,
    RefreshTokensProvider,
    GenerateVerificationTokenProvider,
    VerifyEmailProvider,
    VerificationTokenService,
  ],
  exports: [AuthService, HashingProvider],
})
export class AuthModule {}
