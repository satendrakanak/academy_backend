import { Module } from '@nestjs/common';
import { SlugProvider } from './providers/slug.provider';

@Module({
  providers: [SlugProvider],
  exports: [SlugProvider],
})
export class SlugModule {}
