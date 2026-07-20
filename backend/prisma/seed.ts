import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.create({
    data: { name: 'Akshara Reading Room', slug: 'akshara' },
  });

  const branch = await prisma.branch.create({
    data: { tenantId: tenant.id, name: 'Main Branch', address: 'Hyderabad' },
  });

  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      name: 'Ravi Kumar',
      email: 'ravi@akshara.test',
      password: await bcrypt.hash('password123', 10),
      role: 'TENANT_OWNER',
    },
  });

  // Zones matching the seating screenshot
  const zoneA = await prisma.zone.create({
    data: { tenantId: tenant.id, branchId: branch.id, name: 'Zone A - Window Row', startSeat: 1, endSeat: 24 },
  });
  const zoneB = await prisma.zone.create({
    data: { tenantId: tenant.id, branchId: branch.id, name: 'Zone B - Center Hall', startSeat: 25, endSeat: 72 },
  });
  const zoneC = await prisma.zone.create({
    data: { tenantId: tenant.id, branchId: branch.id, name: 'Zone C - Quiet Corner', startSeat: 73, endSeat: 120 },
  });

  for (const zone of [zoneA, zoneB, zoneC]) {
    for (let n = zone.startSeat; n <= zone.endSeat; n++) {
      await prisma.seat.create({
        data: { tenantId: tenant.id, branchId: branch.id, zoneId: zone.id, seatNumber: n, status: 'FREE' },
      });
    }
  }

  // Sample members
  const kavya = await prisma.member.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      name: 'Kavya N.',
      goalTag: 'SSC Aspirant',
      plan: 'MONTHLY',
      batch: 'Day',
      expiresAt: new Date('2026-08-14'),
      status: 'Active',
    },
  });

  const seat42 = await prisma.seat.findFirst({ where: { branchId: branch.id, seatNumber: 42 } });
  if (seat42) {
    await prisma.seat.update({ where: { id: seat42.id }, data: { memberId: kavya.id, status: 'OCCUPIED' } });
  }

  await prisma.payment.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      memberId: kavya.id,
      amount: 900,
      method: 'UPI',
      status: 'PAID',
      label: 'Monthly Renewal',
    },
  });

  // Sample pending applications
  await prisma.application.createMany({
    data: [
      {
        tenantId: tenant.id,
        branchId: branch.id,
        applicant: 'Pranathi R.',
        goalTag: 'Group II Aspirant',
        plan: 'MONTHLY',
        batch: 'Morning',
        status: 'PENDING',
      },
      {
        tenantId: tenant.id,
        branchId: branch.id,
        applicant: 'Suresh K.',
        goalTag: 'NEET Aspirant',
        plan: 'QUARTERLY',
        batch: 'Day',
        status: 'PENDING',
      },
    ],
  });

  console.log('Seed complete. Tenant:', tenant.slug);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
