import { City } from 'src/location/city.entity';
import { Country } from 'src/location/country.entity';
import { State } from 'src/location/state.entity';
import { DataSource } from 'typeorm';
type CountryJSON = {
  id: string;
  name: string;
  countryCode: string;
  phoneCode?: string;
};

type StateJSON = {
  id: string;
  name: string;
  stateCode: string;
  countryCode: string;
};

type CityJSON = {
  id: string;
  name: string;
  stateCode: string;
  countryCode: string;
};

import countriesJson from './../data/Countries.json';
import statesJson from './../data/States.json';
import citiesJson from './../data/Cities.json';

const countries = countriesJson as CountryJSON[];
const states = statesJson as StateJSON[];
const cities = citiesJson as CityJSON[];

export const seedLocation = async (dataSource: DataSource) => {
  const countryRepository = dataSource.getRepository(Country);
  const stateRepository = dataSource.getRepository(State);
  const cityRepository = dataSource.getRepository(City);

  console.log('🌱 Seeding started...');

  // 🧠 Map for relations
  const countryMap = new Map<string, Country>();
  const stateMap = new Map<string, State>();

  // ======================
  // 🌍 1. Countries
  // ======================
  for (const c of countries) {
    let country = await countryRepository.findOne({
      where: { countryCode: c.countryCode },
    });

    if (!country) {
      country = countryRepository.create({
        name: c.name,
        countryCode: c.countryCode,
        phoneCode: c.phoneCode,
      });

      country = await countryRepository.save(country);
    }

    countryMap.set(c.countryCode, country);
  }

  console.log('✅ Countries seeded');

  // ======================
  // 🏙️ 2. States
  // ======================
  for (const s of states) {
    const country = countryMap.get(s.countryCode);
    if (!country) continue;

    let state = await stateRepository.findOne({
      where: {
        name: s.name,
        country: { id: country.id },
      },
      relations: ['country'],
    });

    if (!state) {
      state = stateRepository.create({
        name: s.name,
        country,
      });

      state = await stateRepository.save(state);
    }

    // composite key (important 🔥)
    stateMap.set(`${s.countryCode}-${s.stateCode}`, state);
  }

  console.log('✅ States seeded');

  // ======================
  // 🌆 3. Cities
  // ======================
  for (const c of cities) {
    const key = `${c.countryCode}-${c.stateCode}`;
    const state = stateMap.get(key);

    if (!state) continue;

    const exists = await cityRepository.findOne({
      where: {
        name: c.name,
        state: { id: state.id },
      },
      relations: ['state'],
    });

    if (!exists) {
      const city = cityRepository.create({
        name: c.name,
        state,
      });

      await cityRepository.save(city);
    }
  }

  console.log('✅ Cities seeded');
  console.log('🎉 Location seeding completed!');
};
