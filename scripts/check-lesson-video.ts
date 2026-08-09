import 'dotenv/config';
import { prisma } from '../src/prisma.js';

const lesson = await prisma.lesson.findUnique({
  where: { id: 'b7667743-a5f6-436f-a840-82ab2448719e' },
  select: { title: true, vdoCipherVideoId: true, videoUrl: true },
});
console.log(JSON.stringify(lesson, null, 2));
await prisma.$disconnect();
