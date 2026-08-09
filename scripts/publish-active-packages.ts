import 'dotenv/config';
import { prisma } from '../src/prisma.js';

/** Publish any active packages that were stuck in DRAFT (legacy create bug). */
const result = await prisma.coursePackage.updateMany({
  where: { isActive: true, publishStatus: 'DRAFT' },
  data: { publishStatus: 'PUBLISHED' },
});

console.log(`Published ${result.count} active draft package(s).`);
await prisma.$disconnect();
