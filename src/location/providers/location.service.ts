import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Country } from '../country.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { State } from '../state.entity';
import { City } from '../city.entity';
import { CreateCountryDto } from '../dtos/create-country.dto';
import { CreateStateDto } from '../dtos/create-state.dto';
import { CreateCityDto } from '../dtos/create-city.dto';

@Injectable()
export class LocationService {
  constructor(
    /**
     * Inject countryRepository
     */
    @InjectRepository(Country)
    private readonly countryRepository: Repository<Country>,

    /**
     * Inject stateRepository
     */
    @InjectRepository(State)
    private readonly stateRepository: Repository<State>,

    /**
     * Inject cityRepository
     */

    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
  ) {}

  // 🌍 COUNTRY
  async createCountry(createCountryDto: CreateCountryDto) {
    const exists = await this.countryRepository.findOne({
      where: { countryCode: createCountryDto.countryCode },
    });

    if (exists) {
      throw new BadRequestException('Country already exists');
    }

    const country = this.countryRepository.create(createCountryDto);
    return this.countryRepository.save(country);
  }

  async getCountries() {
    return this.countryRepository.find({
      order: { name: 'ASC' },
    });
  }

  // 🏙️ STATE
  async createState(createStateDto: CreateStateDto) {
    const country = await this.countryRepository.findOne({
      where: { id: createStateDto.countryId },
    });

    if (!country) {
      throw new NotFoundException('Country not found');
    }

    const exists = await this.stateRepository.findOne({
      where: {
        name: createStateDto.name,
        country: { id: createStateDto.countryId },
      },
    });

    if (exists) {
      throw new BadRequestException('State already exists');
    }

    const state = this.stateRepository.create({
      name: createStateDto.name,
      country,
    });

    return this.stateRepository.save(state);
  }

  async getStatesByCountry(countryId: number) {
    return this.stateRepository.find({
      where: {
        country: { id: countryId },
      },
      order: { name: 'ASC' },
    });
  }

  // 🌆 CITY
  async createCity(createCityDto: CreateCityDto) {
    const state = await this.stateRepository.findOne({
      where: { id: createCityDto.stateId },
    });

    if (!state) {
      throw new NotFoundException('State not found');
    }

    const exists = await this.cityRepository.findOne({
      where: {
        name: createCityDto.name,
        state: { id: createCityDto.stateId },
      },
    });

    if (exists) {
      throw new BadRequestException('City already exists');
    }

    const city = this.cityRepository.create({
      name: createCityDto.name,
      state,
    });

    return this.cityRepository.save(city);
  }

  async getCitiesByState(stateId: number) {
    return this.cityRepository.find({
      where: {
        state: { id: stateId },
      },
      order: { name: 'ASC' },
    });
  }

  // 🌳 TREE API
  async getLocationTree() {
    return this.countryRepository.find({
      relations: ['states', 'states.cities'],
      order: {
        name: 'ASC',
      },
    });
  }
}
