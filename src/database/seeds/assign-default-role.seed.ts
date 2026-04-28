import { Role } from 'src/roles-permissions/role.entity';
import { User } from 'src/users/user.entity';
import { DataSource } from 'typeorm';

export async function assignDefaultRole(dataSource: DataSource) {
  const userRepo = dataSource.getRepository(User);
  const roleRepo = dataSource.getRepository(Role);

  const studentRole = await roleRepo.findOne({
    where: { name: 'student' },
  });

  if (!studentRole) throw new Error('Student role not found');

  const users = await userRepo.find(); // ❗ no relations

  for (const user of users) {
    const hasRole = await dataSource
      .createQueryBuilder()
      .relation(User, 'roles')
      .of(user.id)
      .loadMany();

    if (!hasRole.length) {
      await dataSource
        .createQueryBuilder()
        .relation(User, 'roles')
        .of(user.id)
        .add(studentRole.id);
    }
  }

  console.log('✅ Existing users updated');
}
