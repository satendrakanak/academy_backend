import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import jwtConfig from 'src/auth/config/jwt.config';
import { REQUEST_USER_KEY } from 'src/auth/constants/auth.constants';
import { Request } from 'express';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    /**
     *  Inject jwtService
     */

    private readonly jwtService: JwtService,

    /**
     * Inject jwtConfiguration
     */

    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    //Extract the request from the execution context
    const request = context.switchToHttp().getRequest();

    //Extract the token from the header
    const token = this.extractTokenFromRequest(request);

    //validate the token
    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync(
        token,
        this.jwtConfiguration,
      );
      request[REQUEST_USER_KEY] = payload;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromRequest(request: Request): string | undefined {
    if (request.cookies?.accessToken) {
      return request.cookies.accessToken;
    }
    const [_, token] = request.headers.authorization?.split(' ') ?? [];
    return token;
  }
}
