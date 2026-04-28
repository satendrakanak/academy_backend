import { DataSource } from 'typeorm';
import { Role } from 'src/roles-permissions/role.entity';
import { Permission } from 'src/roles-permissions/permission.entity';

export async function seedRoles(dataSource: DataSource) {
  const roleRepo = dataSource.getRepository(Role);
  const permRepo = dataSource.getRepository(Permission);

  // get permissions
  const allPermissions = await permRepo.find();

  const getPermissions = (names: string[]) =>
    allPermissions.filter((p) => names.includes(p.name));

  // roles config
  const rolesData = [
    {
      name: 'student',
      permissions: ['view_course', 'enroll_course'],
    },
    {
      name: 'faculty',
      permissions: ['create_course', 'update_course', 'view_course'],
    },
    {
      name: 'admin',
      permissions: [
        'create_course',
        'update_course',
        'delete_course',
        'manage_users',
        'approve_faculty',
      ],
    },
  ];

  for (const roleData of rolesData) {
    let role = await roleRepo.findOne({
      where: { name: roleData.name },
      relations: ['permissions'],
    });

    if (!role) {
      role = roleRepo.create({
        name: roleData.name,
        permissions: getPermissions(roleData.permissions),
      });

      await roleRepo.save(role);
    }
  }

  console.log('✅ Roles seeded');
}
