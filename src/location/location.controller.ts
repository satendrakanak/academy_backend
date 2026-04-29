import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { LocationService } from './providers/location.service';
import { CreateCountryDto } from './dtos/create-country.dto';
import { CreateStateDto } from './dtos/create-state.dto';
import { CreateCityDto } from './dtos/create-city.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';

@Auth(AuthType.None)
@Controller()
export class LocationController {
  constructor(
    /**
     * Inject locationService
     */

    private readonly locationService: LocationService,
  ) {}
  // 🌍 COUNTRY APIs

  @Post('countries')
  async createCountry(@Body() createCountryDto: CreateCountryDto) {
    return await this.locationService.createCountry(createCountryDto);
  }

  @Get('countries')
  async getCountries() {
    return await this.locationService.getCountries();
  }
  // 🏙️ STATE APIs

  @Post('states')
  async createState(@Body() createStateDto: CreateStateDto) {
    return await this.locationService.createState(createStateDto);
  }

  @Get('countries/:countryId/states')
  async getStates(@Param('countryId', ParseIntPipe) countryId: number) {
    return await this.locationService.getStatesByCountry(countryId);
  }

  // 🌆 CITY APIs

  @Post('cities')
  async createCity(@Body() createCityDto: CreateCityDto) {
    return await this.locationService.createCity(createCityDto);
  }

  @Get('states/:stateId/cities')
  async getCities(@Param('stateId', ParseIntPipe) stateId: number) {
    return await this.locationService.getCitiesByState(stateId);
  }

  // 🌳 TREE API

  @Get('locations/tree')
  async getLocationTree() {
    return await this.locationService.getLocationTree();
  }
}
