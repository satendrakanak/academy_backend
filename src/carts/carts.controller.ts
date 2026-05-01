import { Body, Controller, Delete, Get, Post } from '@nestjs/common';
import { ActiveUser } from 'src/auth/decorators/active-user.decorator';
import type { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { CartsService } from './providers/carts.service';
import { SyncCartDto } from './dtos/sync-cart.dto';

@Controller('cart')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get()
  async findMine(@ActiveUser() user: ActiveUserData) {
    return this.cartsService.findMine(user.sub);
  }

  @Post('sync')
  async sync(
    @ActiveUser() user: ActiveUserData,
    @Body() syncCartDto: SyncCartDto,
  ) {
    return this.cartsService.sync(user.sub, syncCartDto.items);
  }

  @Delete()
  async clear(@ActiveUser() user: ActiveUserData) {
    await this.cartsService.clear(user.sub);

    return {
      success: true,
    };
  }
}
