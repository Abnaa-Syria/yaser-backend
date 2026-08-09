import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  const trial = await p.trialCourse.findFirst({
    where: { isActive: true },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          units: {
            orderBy: { order: 'asc' },
            take: 1,
            include: {
              sections: {
                where: { deletedAt: null },
                orderBy: { order: 'asc' },
                take: 1,
                include: {
                  lessons: {
                    where: { deletedAt: null },
                    orderBy: { order: 'asc' },
                    take: 3,
                    select: { id: true, title: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!trial?.course) {
    throw new Error('No active trial course');
  }

  const courseId = trial.course.id;
  const unit = trial.course.units[0];
  const lessons = unit?.sections?.[0]?.lessons || [];
  console.log('course', trial.course.title, courseId);
  console.log(
    'lessons',
    lessons.map((l) => l.title)
  );

  // Create a LESSON exam if none, else course-level FINAL
  const existingExam = await p.exam.findFirst({
    where: {
      OR: [
        { courseId },
        { unit: { courseId } },
        { lesson: { section: { unit: { courseId } } } },
      ],
    },
  });

  let examId = existingExam?.id;
  if (!existingExam) {
    const lessonId = lessons[0]?.id || null;
    const exam = await p.exam.create({
      data: {
        title: 'Free Trial Knowledge Check',
        titleAr: 'اختبار معرفة التجربة المجانية',
        description: 'Short quiz included in your free trial. Complete it before the timer ends.',
        descriptionAr: 'اختبار قصير ضمن تجربتك المجانية. أكمله قبل انتهاء المؤقّت.',
        status: 'AVAILABLE',
        type: lessonId ? 'LESSON' : 'FINAL',
        durationMinutes: 15,
        totalPoints: 10,
        passingScore: 6,
        attempts: 3,
        courseId: lessonId ? null : courseId,
        lessonId,
        questions: {
          create: [
            {
              order: 1,
              type: 'MULTIPLE_CHOICE',
              points: 2,
              questionText: 'Which USMLE Step focuses on foundational sciences?',
              options: [
                { id: 'a', text: 'Step 1' },
                { id: 'b', text: 'Step 2 CK' },
                { id: 'c', text: 'Step 3' },
                { id: 'd', text: 'CCS only' },
              ],
              correctAnswer: 'Step 1',
            },
            {
              order: 2,
              type: 'TRUE_FALSE',
              points: 2,
              questionText: 'Active recall improves long-term retention compared with passive re-reading.',
              options: [
                { id: 'true', text: 'True' },
                { id: 'false', text: 'False' },
              ],
              correctAnswer: 'True',
            },
            {
              order: 3,
              type: 'MULTIPLE_CHOICE',
              points: 2,
              questionText: 'A high-yield study habit for Step prep is:',
              options: [
                { id: 'a', text: 'Only watching lectures once' },
                { id: 'b', text: 'Spaced practice with questions' },
                { id: 'c', text: 'Avoiding practice exams' },
                { id: 'd', text: 'Memorizing without understanding' },
              ],
              correctAnswer: 'Spaced practice with questions',
            },
            {
              order: 4,
              type: 'MULTIPLE_CHOICE',
              points: 2,
              questionText: 'Flashcards are most useful when you:',
              options: [
                { id: 'a', text: 'Never review wrong answers' },
                { id: 'b', text: 'Actively retrieve the answer before flipping' },
                { id: 'c', text: 'Only read the back side' },
                { id: 'd', text: 'Skip spaced repetition' },
              ],
              correctAnswer: 'Actively retrieve the answer before flipping',
            },
            {
              order: 5,
              type: 'TRUE_FALSE',
              points: 2,
              questionText: 'This free trial content is meant to help you sample the learning experience before enrolling.',
              options: [
                { id: 'true', text: 'True' },
                { id: 'false', text: 'False' },
              ],
              correctAnswer: 'True',
            },
          ],
        },
      },
    });
    examId = exam.id;
    console.log('created exam', examId);
  } else {
    console.log('exam exists', examId);
  }

  // Flashcards on first 1-2 lessons
  let createdCards = 0;
  for (const lesson of lessons.slice(0, 2)) {
    const count = await p.flashcard.count({ where: { lessonId: lesson.id } });
    if (count > 0) continue;
    await p.flashcard.createMany({
      data: [
        {
          lessonId: lesson.id,
          status: 'PUBLISHED',
          displayOrder: 1,
          front: 'What is spaced repetition?',
          frontAr: 'ما هو التكرار المتباعد؟',
          back: 'Reviewing material at increasing intervals to strengthen memory.',
          backAr: 'مراجعة المادة على فترات متزايدة لتقوية الذاكرة.',
          explanation: 'Used heavily in USMLE prep with Anki-style decks.',
          explanationAr: 'يُستخدم بكثرة في تحضير USMLE مع بطاقات شبيهة بـ Anki.',
        },
        {
          lessonId: lesson.id,
          status: 'PUBLISHED',
          displayOrder: 2,
          front: 'Define active recall.',
          frontAr: 'عرّف الاسترجاع النشط.',
          back: 'Trying to remember an answer from memory before checking notes.',
          backAr: 'محاولة تذكّر الإجابة من الذاكرة قبل مراجعة الملاحظات.',
        },
        {
          lessonId: lesson.id,
          status: 'PUBLISHED',
          displayOrder: 3,
          front: 'Why practice questions matter for Step 1?',
          frontAr: 'لماذا أسئلة التدريب مهمة لـ Step 1؟',
          back: 'They train pattern recognition and application, not just memorization.',
          backAr: 'تدرّب التعرف على الأنماط والتطبيق وليس الحفظ فقط.',
        },
      ],
    });
    createdCards += 3;
  }

  console.log({ examId, createdCards });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
