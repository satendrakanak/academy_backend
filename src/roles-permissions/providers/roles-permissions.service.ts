import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '../role.entity';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from '../permission.entity';

@Injectable()
export class RolesPermissionsService {
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
  ) {}

  async findAll(): Promise<Role[]> {
    return await this.roleRepository.find();
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
    const role = await this.roleRepository.findOne({ where: { id } });
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
}
