import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { seedPermissions } from './seeds/permission.seed';
import { seedRoles } from './seeds/role.seed';
import { Role } from 'src/roles-permissions/role.entity';
import { Permission } from 'src/roles-permissions/permission.entity';
import { assignDefaultRole } from './seeds/assign-default-role.seed';
import { User } from 'src/users/user.entity';
import { Category } from 'src/categories/category.entity';
import { Course } from 'src/courses/course.entity';
import { Tag } from 'src/tags/tag.entity';
import { Enrollment } from 'src/enrollments/enrollment.entity';
import { Order } from 'src/orders/order.entity';
import { UserProgressController } from 'src/user-progress/user-progress.controller';
import { OrderItem } from 'src/orders/order-item.entity';
import { Upload } from 'src/uploads/upload.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'shivaan',
  password: '1234',
  database: 'unitus',

  entities: [
    Role,
    Permission,
    User,
    Category,
    Course,
    Tag,
    Enrollment,
    Order,

    Upload,
    OrderItem,
  ],
  synchronize: false,
});

async function run() {
  await AppDataSource.initialize();

  // await seedPermissions(AppDataSource);
  // await seedRoles(AppDataSource);

  await assignDefaultRole(AppDataSource);

  await AppDataSource.destroy();

  console.log('🔥 DONE');
}

run();
