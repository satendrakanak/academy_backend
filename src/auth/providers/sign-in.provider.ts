import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  RequestTimeoutException,
  UnauthorizedException,
} from '@nestjs/common';
import { HashingProvider } from './hashing.provider';
import { SignInDto } from '../dtos/sign-in.dto';
import { UsersService } from 'src/users/providers/users.service';
import { GenerateTokensProvider } from './generate-tokens.provider';

@Injectable()
export class SignInProvider {
  constructor(
    /**
     * Inject hashingProvider
     */

    private readonly hashingProvider: HashingProvider,

    /**
     * Inject usersService
     */
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,

    /**
     * Inject generateTokensProvider
     */

    private readonly generateTokensProvider: GenerateTokensProvider,
  ) {}

  public async signIn(signInDto: SignInDto) {
    //Find user by email

    let user = await this.usersService.findOneByEmail(signInDto.email);
    //Throw an exception if user not found
    if (!user) {
      throw new NotFoundException('User not exist');
    }
    //Compare password to the hash

    let isEqual: boolean = false;

    try {
      isEqual = await this.hashingProvider.comparePassword(
        signInDto.password,
        user.password,
      );
    } catch (error) {
      throw new RequestTimeoutException(error, {
        description: 'Unable to compare password to hash',
      });
    }

    if (!isEqual) {
      throw new UnauthorizedException('Password is incorrect', {
        description: 'Password is incorrect',
      });
    }

    return this.generateTokensProvider.generateTokens(user);
  }
}
