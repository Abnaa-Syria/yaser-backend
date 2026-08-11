import { PrismaClient } from '@prisma/client';
import { seedBadgeDefinitions } from '../src/modules/student/gamification/gamification.service.js';

const prisma = new PrismaClient();

async function main() {
  const result = await seedBadgeDefinitions();
  console.log(`Seeded ${result.count} badge definitions + weekly challenge.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
