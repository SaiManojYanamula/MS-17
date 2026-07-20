import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { slug: 'zenith-study-hall' } });
  if (!tenant) throw new Error('Tenant zenith-study-hall not found');

  const branch = await prisma.branch.findFirst({ where: { tenantId: tenant.id } });
  if (!branch) throw new Error('Branch not found for tenant');

  const zoneA = await prisma.zone.create({
    data: { tenantId: tenant.id, branchId: branch.id, name: 'Zone A - Main Hall', startSeat: 1, endSeat: 15 },
  });
  const zoneB = await prisma.zone.create({
    data: { tenantId: tenant.id, branchId: branch.id, name: 'Zone B - Reading Corner', startSeat: 16, endSeat: 30 },
  });

  for (const zone of [zoneA, zoneB]) {
    for (let n = zone.startSeat; n <= zone.endSeat; n++) {
      await prisma.seat.create({
        data: { tenantId: tenant.id, branchId: branch.id, zoneId: zone.id, seatNumber: n, status: 'FREE' },
      });
    }
  }

  console.log('Created zones:', zoneA.name, zoneB.name);
  console.log('Total seats:', zoneA.endSeat - zoneA.startSeat + 1 + (zoneB.endSeat - zoneB.startSeat + 1));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
