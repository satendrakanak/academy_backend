import { DataSource } from 'typeorm';
import { Permission } from 'src/roles-permissions/permission.entity';

export async function seedPermissions(dataSource: DataSource) {
  const repo = dataSource.getRepository(Permission);

  const permissions = [
    'view_dashboard',
    'create_course',
    'update_course',
    'delete_course',
    'view_course',
    'enroll_course',
    'view_category',
    'create_category',
    'update_category',
    'delete_category',
    'view_tag',
    'create_tag',
    'update_tag',
    'delete_tag',
    'view_article',
    'create_article',
    'update_article',
    'delete_article',
    'view_coupon',
    'create_coupon',
    'update_coupon',
    'delete_coupon',
    'view_order',
    'create_order',
    'update_order',
    'delete_order',
    'view_testimonial',
    'create_testimonial',
    'update_testimonial',
    'delete_testimonial',
    'view_user',
    'create_user',
    'update_user',
    'delete_user',
    'view_role',
    'create_role',
    'update_role',
    'delete_role',
    'view_permission',
    'create_permission',
    'update_permission',
    'delete_permission',
    'view_settings',
    'update_settings',
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
