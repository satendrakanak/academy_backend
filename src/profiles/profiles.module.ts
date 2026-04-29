import { forwardRef, Module } from '@nestjs/common';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './providers/profiles.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacultyProfile } from './faculty-profile.entity';
import { UserProfile } from './user-profile.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserProfile, FacultyProfile]),
    forwardRef(() => UsersModule),
  ],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
