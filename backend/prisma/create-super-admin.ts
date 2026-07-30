import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@studyhall.test';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'superadmin123';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Super Admin already exists:', email);
    return;
  }

  const admin = await prisma.user.create({
    data: {
      tenantId: null,
      name: 'Platform Super Admin',
      email,
      password: await bcrypt.hash(password, 10),
      role: 'SUPER_ADMIN',
    },
  });

  console.log('Super Admin created:', admin.email);
  console.log('Password:', password);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
