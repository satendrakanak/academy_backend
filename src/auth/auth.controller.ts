import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { SignInDto } from './dtos/sign-in.dto';
import { AuthService } from './providers/auth.service';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { Auth } from './decorators/auth.decorator';
import { AuthType } from './enums/auth-type.enum';
import { SignupDto } from './dtos/sign-up.dto';
import {
  ApiResponse,
  LoginResponse,
} from 'src/common/interfaces/api-response.interface';
import { User } from 'src/users/user.entity';

@Controller('auth')
export class AuthController {
  constructor(
    /**
     * Inject authService
     */

    private readonly authService: AuthService,
  ) {}

  @Auth(AuthType.None)
  @HttpCode(HttpStatus.OK)
  @Post('sign-in')
  public async signIn(
    @Body() signInDto: SignInDto,
  ): Promise<ApiResponse<LoginResponse>> {
    const result = await this.authService.signIn(signInDto);
    return {
      success: true,
      message: 'User logged in successfully',
      data: result,
    };
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
  @HttpCode(HttpStatus.OK)
  @Post('refresh-tokens')
  public async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refreshTokens(refreshTokenDto);
  }

  @Auth(AuthType.None)
  @HttpCode(HttpStatus.OK)
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }
}
