const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    console.log("Testing Prisma query...");
    // Let's find an instructor ID
    const instructor = await prisma.user.findFirst({
      where: {
        role: {
          name: 'INSTRUCTOR'
        }
      }
    });

    if (!instructor) {
      console.log("No instructor user found in database!");
      return;
    }

    console.log("Found instructor ID:", instructor.id);

    const purchases = await prisma.coursePurchase.findMany({
      where: {
        course: {
          instructorId: instructor.id,
          deletedAt: null,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
            phone: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    console.log("Query succeeded! Total purchases found:", purchases.length);
    if (purchases.length > 0) {
      console.log("Sample purchase course title:", purchases[0].course?.title);
    }
  } catch (e) {
    console.error("Prisma query failed:", e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
