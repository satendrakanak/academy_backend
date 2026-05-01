import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { join } from 'path';

import { seedPermissions } from './seeds/permission.seed';
import { seedRoles } from './seeds/role.seed';
import { assignDefaultRole } from './seeds/assign-default-role.seed';
import { seedEmailTemplates } from './seeds/email-template.seed';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'shivaan',
  password: '1234',
  database: 'unitus',
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  synchronize: false,
});

async function run() {
  await AppDataSource.initialize();

  await seedPermissions(AppDataSource);
  await seedRoles(AppDataSource);

  await assignDefaultRole(AppDataSource);
  await seedEmailTemplates(AppDataSource);

  await AppDataSource.destroy();

  console.log('🔥 DONE');
}

run();
