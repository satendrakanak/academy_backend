import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '../role.entity';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from '../permission.entity';
import { User } from 'src/users/user.entity';
import { CreateRoleDto } from '../dtos/create-role.dto';
import { UpdateRoleDto } from '../dtos/update-role.dto';
import { CreatePermissionDto } from '../dtos/create-permission.dto';
import { UpdatePermissionDto } from '../dtos/update-permission.dto';

@Injectable()
export class RolesPermissionsService {
  private readonly protectedRoleNames = new Set(['student', 'faculty', 'admin']);

  constructor(
    /**
     * Inject roleRepository
     */

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    /**
     * Inject permissionRepository
     */

    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<Role[]> {
    return await this.roleRepository.find({
      relations: ['permissions'],
      order: {
        name: 'ASC',
      },
    });
  }

  async findAllPermissions(): Promise<Permission[]> {
    return await this.permissionRepository.find({
      order: {
        name: 'ASC',
      },
    });
  }

  async getDashboard() {
    const [roles, permissions] = await Promise.all([
      this.findAll(),
      this.findAllPermissions(),
    ]);

    return {
      roles,
      permissions,
    };
  }

  async findRoleByName(name: string) {
    // find role
    const role = await this.roleRepository.findOne({ where: { name } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async findById(id: number): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async findByIds(ids: number[]): Promise<Role[]> {
    const roles = await this.roleRepository.findBy({
      id: In(ids),
    });
    if (roles.length === 0) {
      throw new NotFoundException('Role not found');
    }
    return roles;
  }

  async createRole(createRoleDto: CreateRoleDto): Promise<Role> {
    const name = this.normalizeName(createRoleDto.name);
    const exists = await this.roleRepository.findOne({
      where: { name },
    });

    if (exists) {
      throw new BadRequestException('Role already exists');
    }

    const permissions = createRoleDto.permissionIds?.length
      ? await this.findPermissionsByIds(createRoleDto.permissionIds)
      : [];

    const role = this.roleRepository.create({
      name,
      permissions,
    });

    return await this.roleRepository.save(role);
  }

  async updateRole(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findById(id);

    if (updateRoleDto.name) {
      const nextName = this.normalizeName(updateRoleDto.name);

      if (
        this.protectedRoleNames.has(role.name) &&
        nextName !== role.name
      ) {
        throw new BadRequestException('System roles cannot be renamed');
      }

      const duplicate = await this.roleRepository.findOne({
        where: { name: nextName },
      });

      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException('Role name already exists');
      }

      role.name = nextName;
    }

    if (updateRoleDto.permissionIds !== undefined) {
      role.permissions = updateRoleDto.permissionIds.length
        ? await this.findPermissionsByIds(updateRoleDto.permissionIds)
        : [];
    }

    return await this.roleRepository.save(role);
  }

  async deleteRole(id: number): Promise<{ message: string }> {
    const role = await this.findById(id);

    if (this.protectedRoleNames.has(role.name)) {
      throw new BadRequestException('System roles cannot be deleted');
    }

    const usersCount = await this.userRepository.count({
      where: {
        roles: {
          id,
        },
      },
      relations: ['roles'],
    });

    if (usersCount > 0) {
      throw new BadRequestException(
        'Cannot delete a role that is assigned to users',
      );
    }

    await this.roleRepository.remove(role);

    return {
      message: 'Role deleted successfully',
    };
  }

  async createPermission(
    createPermissionDto: CreatePermissionDto,
  ): Promise<Permission> {
    const name = this.normalizeName(createPermissionDto.name);
    const exists = await this.permissionRepository.findOne({
      where: { name },
    });

    if (exists) {
      throw new BadRequestException('Permission already exists');
    }

    const permission = this.permissionRepository.create({ name });

    return await this.permissionRepository.save(permission);
  }

  async updatePermission(
    id: number,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    if (updatePermissionDto.name) {
      const nextName = this.normalizeName(updatePermissionDto.name);

      const duplicate = await this.permissionRepository.findOne({
        where: { name: nextName },
      });

      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException('Permission already exists');
      }

      permission.name = nextName;
    }

    return await this.permissionRepository.save(permission);
  }

  async deletePermission(id: number): Promise<{ message: string }> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    const roleUsingPermission = await this.roleRepository.findOne({
      where: {
        permissions: {
          id,
        },
      },
      relations: ['permissions'],
    });

    if (roleUsingPermission) {
      throw new BadRequestException(
        'Remove this permission from roles before deleting it',
      );
    }

    await this.permissionRepository.remove(permission);

    return {
      message: 'Permission deleted successfully',
    };
  }

  private async findPermissionsByIds(ids: number[]): Promise<Permission[]> {
    const uniqueIds = [...new Set(ids)];
    const permissions = await this.permissionRepository.findBy({
      id: In(uniqueIds),
    });

    if (permissions.length !== uniqueIds.length) {
      throw new BadRequestException('Invalid permission(s) provided');
    }

    return permissions;
  }

  private normalizeName(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, '_');
  }
}
