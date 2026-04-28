import {
  Body,
  Controller,
  forwardRef,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { SignInDto } from './dtos/sign-in.dto';
import { AuthService } from './providers/auth.service';
import { Auth } from './decorators/auth.decorator';
import { AuthType } from './enums/auth-type.enum';
import { SignupDto } from './dtos/sign-up.dto';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';
import { User } from 'src/users/user.entity';
import type { Response as ExpressResponse, Request } from 'express';
import { httpOnlyCookieOptions } from './cookies/cookies-options';
import { UsersService } from 'src/users/providers/users.service';
import { ResetPasswordDto } from './dtos/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(
    /**
     * Inject authService
     */

    private readonly authService: AuthService,

    /**
     * Inject usersService
     */

    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  @Auth(AuthType.None)
  @HttpCode(HttpStatus.OK)
  @Post('sign-in')
  public async signIn(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) res: ExpressResponse,
  ): Promise<ApiResponse<null>> {
    const { accessToken, refreshToken } =
      await this.authService.signIn(signInDto);
    res.cookie('accessToken', accessToken, httpOnlyCookieOptions);
    res.cookie('refreshToken', refreshToken, httpOnlyCookieOptions);

    return {
      success: true,
      message: 'User logged in successfully',
      data: null,
    };
  }

  @Get('profile')
  async getProfile(@Req() req) {
    const userId = req.user.sub;
    return await this.usersService.findOneById(userId);
  }

  @Auth(AuthType.None)
  @HttpCode(HttpStatus.OK)
  @Post('sign-up')
  public async signUp(
    @Body() signupDto: SignupDto,
  ): Promise<ApiResponse<User>> {
    const result = await this.authService.signUp(signupDto);
    return {
      success: true,
      message: 'User registered successfully',
      data: result,
    };
  }

  @Auth(AuthType.None)
  @Post('sign-out')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: ExpressResponse) {
    // 🍪 clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return {
      message: 'Logged out successfully',
    };
  }

  @Auth(AuthType.None)
  @HttpCode(HttpStatus.OK)
  @Post('refresh-tokens')
  public async refreshTokens(
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    const oldRefreshToken = req.cookies.refreshToken;
    const { accessToken, refreshToken } =
      await this.authService.refreshTokens(oldRefreshToken);
    res.cookie('accessToken', accessToken, httpOnlyCookieOptions);
    res.cookie('refreshToken', refreshToken, httpOnlyCookieOptions);
    return { success: true };
  }

  @Auth(AuthType.None)
  @HttpCode(HttpStatus.OK)
  @Get('verify-email')
  async verifyEmail(
    @Query('token') token: string,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    const { accessToken, refreshToken } =
      await this.authService.verifyEmail(token);
    res.cookie('accessToken', accessToken, httpOnlyCookieOptions);
    res.cookie('refreshToken', refreshToken, httpOnlyCookieOptions);

    return { success: true };
  }

  @Auth(AuthType.None)
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Auth(AuthType.None)
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.authService.resetPassword(resetPasswordDto);
  }
}
