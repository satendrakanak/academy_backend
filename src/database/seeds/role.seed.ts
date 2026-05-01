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
      permissions: ['view_course', 'enroll_course', 'view_article'],
    },
    {
      name: 'faculty',
      permissions: ['view_course', 'update_course', 'view_article'],
    },
    {
      name: 'admin',
      permissions: allPermissions.map((permission) => permission.name),
    },
  ];

  for (const roleData of rolesData) {
    let role = await roleRepo.findOne({
      where: { name: roleData.name },
      relations: ['permissions'],
    });

    const nextPermissions = getPermissions(roleData.permissions);

    if (!role) {
      role = roleRepo.create({
        name: roleData.name,
        permissions: nextPermissions,
      });
    } else {
      role.permissions = nextPermissions;
    }

    await roleRepo.save(role);
  }

  console.log('✅ Roles seeded');
}
