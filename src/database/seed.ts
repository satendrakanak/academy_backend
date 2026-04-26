import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { Country } from 'src/location/country.entity';
import { State } from 'src/location/state.entity';
import { City } from 'src/location/city.entity';

import { seedLocation } from './seeds/location.seed';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'shivaan',
  password: '1234',
  database: 'unitus',

  entities: [Country, State, City],
  synchronize: false,
});

async function run() {
  await AppDataSource.initialize();

  await seedLocation(AppDataSource);

  await AppDataSource.destroy();

  console.log('🔥 DONE');
}

run();
