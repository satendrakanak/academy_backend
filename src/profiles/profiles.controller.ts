import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ProfilesService } from './providers/profiles.service';
import { ActiveUser } from 'src/auth/decorators/active-user.decorator';
import type { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { UpdateProfileDto } from './dtos/update-profile.dto';

@Controller('profiles')
export class ProfilesController {
  constructor(
    /**
     * Inject profilesService
     */

    private readonly profilesService: ProfilesService,
  ) {}

  @Get('me')
  getMyProfile(@ActiveUser() user: ActiveUserData) {
    return this.profilesService.getMyProfile(user.sub);
  }

  @Patch('me')
  updateMyProfile(
    @ActiveUser() user: ActiveUserData,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profilesService.updateProfile(user.sub, updateProfileDto);
  }

  @Get(':username')
  getPublicProfile(@Param('username') username: string) {
    return this.profilesService.getPublicProfile(username);
  }
}
