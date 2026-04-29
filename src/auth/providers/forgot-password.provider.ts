import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/mail/providers/mail.service';
import { UsersService } from 'src/users/providers/users.service';

@Injectable()
export class ForgotPasswordProvider {
  constructor(
    /**
     * Inject usersService
     */

    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,

    /**
     * Inject jwtService
     */

    private readonly jwtService: JwtService,

    /**
     * Inject mailService
     */

    private readonly mailService: MailService,
  ) {}
  async forgotPassword(email: string) {
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      return { message: 'If email exists, reset link sent' };
    }

    const token = this.jwtService.sign(
      { userId: user.id },
      { expiresIn: '15m' },
    );

    await this.mailService.sendForgotPasswordEmail(user, token);
    return { message: 'Reset link sent' };
  }
}
