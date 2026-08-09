import 'dotenv/config';
import { prisma } from '../src/prisma.js';
import { PLATFORM_CURRENCY } from '../src/config/currency.js';

const wallets = await prisma.wallet.updateMany({
  where: { NOT: { currency: PLATFORM_CURRENCY } },
  data: { currency: PLATFORM_CURRENCY },
});
const packages = await prisma.coursePackage.updateMany({
  where: { NOT: { currency: PLATFORM_CURRENCY } },
  data: { currency: PLATFORM_CURRENCY },
});
const tiers = await prisma.coursePackagePricingTier.updateMany({
  where: { NOT: { currency: PLATFORM_CURRENCY } },
  data: { currency: PLATFORM_CURRENCY },
});

console.log({ wallets: wallets.count, packages: packages.count, tiers: tiers.count });
await prisma.$disconnect();
