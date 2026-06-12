/**
 * Plik: prisma/seed.ts
 * Cel: Wypełnienie bazy danymi demonstracyjnymi — konto administratora oraz
 *      konto pracownika. Uruchamiane przez `npm run db:seed` lub
 *      `prisma migrate reset`.
 * Zależności: @prisma/client, bcryptjs.
 *
 * Dane logowania (demo):
 *   ADMIN    — admin@apkafirmowa.app    / Admin1234!
 *   PRACOWNIK— pracownik@apkafirmowa.app / Pracownik1234!
 */
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Min. 12 rund bcrypt zgodnie z wymaganiami bezpieczeństwa.
const BCRYPT_ROUNDS = 12;

async function main() {
  const adminPassword = await bcrypt.hash('Admin1234!', BCRYPT_ROUNDS);
  const employeePassword = await bcrypt.hash('Pracownik1234!', BCRYPT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@apkafirmowa.app' },
    update: {},
    create: {
      email: 'admin@apkafirmowa.app',
      name: 'Administrator Demo',
      hashedPassword: adminPassword,
      role: Role.ADMIN,
      phone: '+48 600 000 001',
      active: true,
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: 'pracownik@apkafirmowa.app' },
    update: {},
    create: {
      email: 'pracownik@apkafirmowa.app',
      name: 'Pracownik Demo',
      hashedPassword: employeePassword,
      role: Role.EMPLOYEE,
      phone: '+48 600 000 002',
      active: true,
    },
  });

  console.log('✅ Seed zakończony. Utworzone konta:');
  console.log(`   ADMIN     → ${admin.email} / Admin1234!`);
  console.log(`   PRACOWNIK → ${employee.email} / Pracownik1234!`);
}

main()
  .catch((e) => {
    console.error('❌ Błąd seeda:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
