import { PrismaClient, Role } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@tasktracker.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin12345';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: 'Admin User',
        email: adminEmail,
        password: await hashPassword(adminPassword),
        role: Role.ADMIN,
      },
    });
    console.log(`Created admin user: ${adminEmail}`);
  } else if (existingAdmin.role !== Role.ADMIN) {
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: Role.ADMIN },
    });
    console.log(`Promoted existing user to admin: ${adminEmail}`);
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
