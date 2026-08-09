import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const users = await prisma.user.findMany({
  take: 15,
  select: { email: true, fullName: true },
  orderBy: { createdAt: 'desc' },
});
console.log(JSON.stringify(users, null, 2));
await prisma.$disconnect();
