import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.create({
    data: { name: 'Zenith Study Hall', slug: 'zenith-study-hall' },
  });

  const branch = await prisma.branch.create({
    data: { tenantId: tenant.id, name: 'Main Branch' },
  });

  const owner = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      name: 'manoj',
      email: 'lumolearn.trainings@gmail.com',
      password: await bcrypt.hash('manoj123', 10),
      role: 'TENANT_OWNER',
    },
  });

  console.log('Tenant created:', tenant.name, tenant.slug);
  console.log('Owner login:', owner.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
