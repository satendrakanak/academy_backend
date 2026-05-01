import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from './cart.entity';
import { CartItem } from './cart-item.entity';
import { Course } from 'src/courses/course.entity';
import { User } from 'src/users/user.entity';
import { CartsController } from './carts.controller';
import { CartsService } from './providers/carts.service';
import { MediaFileMappingModule } from 'src/common/media-file-mapping/media-file-mapping.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cart, CartItem, Course, User]),
    MediaFileMappingModule,
  ],
  controllers: [CartsController],
  providers: [CartsService],
  exports: [CartsService],
})
export class CartsModule {}
