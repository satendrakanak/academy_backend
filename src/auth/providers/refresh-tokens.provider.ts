import {
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GenerateTokensProvider } from './generate-tokens.provider';
import jwtConfig from '../config/jwt.config';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ActiveUserData } from '../interfaces/active-user-data.interface';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { UsersService } from 'src/users/providers/users.service';

@Injectable()
export class RefreshTokensProvider {
  constructor(
    /* Injecting usersService */
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,

    /**
     * Inject generateTokensProvider
     */

    private readonly generateTokensProvider: GenerateTokensProvider,

    /**
     * Inject jwtService
     */

    private readonly jwtService: JwtService,

    /**
     * Inject jwtConfiguration
     */

    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  public async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    try {
      const { sub } = await this.jwtService.verifyAsync<
        Pick<ActiveUserData, 'sub'>
      >(refreshTokenDto.refreshToken, {
        secret: this.jwtConfiguration.secret,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
      });

      const user = await this.usersService.findOneById(sub);

      return this.generateTokensProvider.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException(error);
    }
  }
}
