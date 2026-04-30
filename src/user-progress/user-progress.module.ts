import { Module } from '@nestjs/common';
import { UserProgressController } from './user-progress.controller';
import { UserProgressService } from './providers/user-progress.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProgres } from './user-progres.entity';
import { CertificatesModule } from 'src/certificates/certificates.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserProgres]), CertificatesModule],
  controllers: [UserProgressController],
  providers: [UserProgressService],
  exports: [UserProgressService],
})
export class UserProgressModule {}
