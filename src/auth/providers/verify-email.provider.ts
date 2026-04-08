import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { VerificationTokenService } from './verification-token.service';
import { TokenType } from '../enums/token-type.enum';
import { UsersService } from 'src/users/providers/users.service';
import { GenerateTokensProvider } from './generate-tokens.provider';
import { LoginResponse } from 'src/common/interfaces/api-response.interface';

@Injectable()
export class VerifyEmailProvider {
  constructor(
    /**
     * Inject usersService
     */
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,

    /**
     * Inject verificationTokenService
     */

    private readonly verificationTokenService: VerificationTokenService,
    /**
     * Inject generateTokensProvider
     */

    private readonly generateTokensProvider: GenerateTokensProvider,
  ) {}

  async verify(token: string): Promise<LoginResponse> {
    const record = await this.verificationTokenService.getValidToken({
      token,
      type: TokenType.EMAIL_VERIFICATION,
    });

    const user = await this.usersService.markEmailVerified(record.userId);
    await this.verificationTokenService.delete(record);

    return await this.generateTokensProvider.generateTokens(user);
  }
}
