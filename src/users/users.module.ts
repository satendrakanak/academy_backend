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
import { UpdatePasswordProvider } from './providers/update-password.provider';
import { RolesPermissionsModule } from 'src/roles-permissions/roles-permissions.module';
import { ProfilesModule } from 'src/profiles/profiles.module';
import { GenerateUsernameProvider } from './providers/generate-username.provider';
import { ChangePasswordProvider } from './providers/change-password.provider';
import { GetDashboardStatsProvider } from './providers/get-dashboard-stats.provider';
import { EnrollmentsModule } from 'src/enrollments/enrollments.module';
import { UserProgres } from 'src/user-progress/user-progres.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProgres]),
    forwardRef(() => AuthModule),
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    PaginationModule,
    RolesPermissionsModule,
    forwardRef(() => ProfilesModule),
    EnrollmentsModule,
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
    UpdatePasswordProvider,
    GenerateUsernameProvider,
    ChangePasswordProvider,
    GetDashboardStatsProvider,
  ],
  exports: [UsersService],
})
export class UsersModule {}
