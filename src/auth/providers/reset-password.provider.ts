import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/providers/users.service';
import { MailService } from 'src/mail/providers/mail.service';

@Injectable()
export class ResetPasswordProvider {
  constructor(
    /**
     * Inject jwtService
     */

    private readonly jwtService: JwtService,

    /**
     * Inject usersService
     */

    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,

    /**
     * Inject mailService
     */

    private readonly mailService: MailService,
  ) {}
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
      const payload = this.jwtService.verify(resetPasswordDto.token);

      const user = await this.usersService.updatePassword(
        payload.userId,
        resetPasswordDto.password,
        resetPasswordDto.confirmPassword,
      );

      await this.mailService.sendResetPasswordEmail(user);

      return { message: 'Password updated' };
    } catch {
      throw new BadRequestException('Invalid or expired token');
    }
  }
}
