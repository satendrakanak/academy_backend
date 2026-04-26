import { Module } from '@nestjs/common';
import { LocationController } from './location.controller';
import { LocationService } from './providers/location.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Country } from './country.entity';
import { State } from './state.entity';
import { City } from './city.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Country, State, City])],
  controllers: [LocationController],
  providers: [LocationService],
  exports: [LocationService],
})
export class LocationModule {}
