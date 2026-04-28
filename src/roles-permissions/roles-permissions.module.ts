import { Module } from '@nestjs/common';
import { RolesPermissionsController } from './roles-permissions.controller';
import { RolesPermissionsService } from './providers/roles-permissions.service';
import { Type } from 'class-transformer';
import { Permission } from './permission.entity';
import { Role } from './role.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission])],
  controllers: [RolesPermissionsController],
  providers: [RolesPermissionsService],
  exports: [RolesPermissionsService],
})
export class RolesPermissionsModule {}
