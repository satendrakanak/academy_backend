import { DataSource } from 'typeorm';
import { Permission } from 'src/roles-permissions/permission.entity';

export async function seedPermissions(dataSource: DataSource) {
  const repo = dataSource.getRepository(Permission);

  const permissions = [
    'create_course',
    'update_course',
    'delete_course',
    'view_course',
    'enroll_course',
    'manage_users',
    'approve_faculty',
  ];

  for (const name of permissions) {
    const exists = await repo.findOne({ where: { name } });

    if (!exists) {
      await repo.save({ name });
    }
  }

  console.log('✅ Permissions seeded');
}
