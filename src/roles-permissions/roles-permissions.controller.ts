import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ActiveUser } from 'src/auth/decorators/active-user.decorator';
import type { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { RolesPermissionsService } from './providers/roles-permissions.service';
import { CreateRoleDto } from './dtos/create-role.dto';
import { UpdateRoleDto } from './dtos/update-role.dto';
import { CreatePermissionDto } from './dtos/create-permission.dto';
import { UpdatePermissionDto } from './dtos/update-permission.dto';

@Controller('roles-permissions')
export class RolesPermissionsController {
  constructor(
    /**
     * Inject rolesPermissionsService
     */
    private readonly rolesPermissionsService: RolesPermissionsService,
  ) {}

  @Get()
  async findAll() {
    return await this.rolesPermissionsService.findAll();
  }

  @Get('dashboard')
  async getDashboard(@ActiveUser() user: ActiveUserData) {
    this.assertAdmin(user);
    return await this.rolesPermissionsService.getDashboard();
  }

  @Get('permissions')
  async findAllPermissions(@ActiveUser() user: ActiveUserData) {
    this.assertAdmin(user);
    return await this.rolesPermissionsService.findAllPermissions();
  }

  @Post('roles')
  async createRole(
    @Body() createRoleDto: CreateRoleDto,
    @ActiveUser() user: ActiveUserData,
  ) {
    this.assertAdmin(user);
    return await this.rolesPermissionsService.createRole(createRoleDto);
  }

  @Patch('roles/:id')
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
    @ActiveUser() user: ActiveUserData,
  ) {
    this.assertAdmin(user);
    return await this.rolesPermissionsService.updateRole(id, updateRoleDto);
  }

  @Delete('roles/:id')
  async deleteRole(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserData,
  ) {
    this.assertAdmin(user);
    return await this.rolesPermissionsService.deleteRole(id);
  }

  @Post('permissions')
  async createPermission(
    @Body() createPermissionDto: CreatePermissionDto,
    @ActiveUser() user: ActiveUserData,
  ) {
    this.assertAdmin(user);
    return await this.rolesPermissionsService.createPermission(
      createPermissionDto,
    );
  }

  @Patch('permissions/:id')
  async updatePermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePermissionDto: UpdatePermissionDto,
    @ActiveUser() user: ActiveUserData,
  ) {
    this.assertAdmin(user);
    return await this.rolesPermissionsService.updatePermission(
      id,
      updatePermissionDto,
    );
  }

  @Delete('permissions/:id')
  async deletePermission(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserData,
  ) {
    this.assertAdmin(user);
    return await this.rolesPermissionsService.deletePermission(id);
  }

  private assertAdmin(user: ActiveUserData) {
    if (!user?.roles?.includes('admin')) {
      throw new ForbiddenException('Only admin users can manage access control');
    }
  }
}
