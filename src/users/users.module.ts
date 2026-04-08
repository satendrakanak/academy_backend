import { forwardRef, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './providers/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { CreateUserProvider } from './providers/create-user.provider';
import { AuthModule } from 'src/auth/auth.module';
import { FindOneByEmailProvider } from './providers/find-one-by-email.provider';
import { FindOneByIdProvider } from './providers/find-one-by-id.provider';
import { ConfigModule } from '@nestjs/config';
import jwtConfig from 'src/auth/config/jwt.config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { AccessTokenGuard } from 'src/auth/guards/access-token/access-token.guard';
import { CreateBulkUsersProvider } from './providers/create-bulk-users.provider';
import { PaginationModule } from 'src/common/pagination/pagination.module';
import { UpdateUserProvider } from './providers/update-user.provider';
import { RestoreUserProvider } from './providers/restore-user.provider';
import { DeleteUserProvider } from './providers/delete-user.provider';
import { MarkEmailVerifiedProvider } from './providers/mark-email-verified.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => AuthModule),
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    PaginationModule,
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    CreateUserProvider,
    FindOneByEmailProvider,
    FindOneByIdProvider,
    CreateBulkUsersProvider,
    UpdateUserProvider,
    RestoreUserProvider,
    DeleteUserProvider,
    MarkEmailVerifiedProvider,
  ],
  exports: [UsersService],
})
export class UsersModule {}
