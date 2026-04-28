import { Controller, Get } from '@nestjs/common';
import { RolesPermissionsService } from './providers/roles-permissions.service';

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
}
