/**
 * Seed public CMS content (HomePageSection keys + footer settings + static pages).
 * Safe to re-run: upserts by key/slug without wiping custom admin edits if you skip --force.
 *
 * Usage:
 *   npx tsx scripts/seed-public-cms.ts
 *   npx tsx scripts/seed-public-cms.ts --force   # overwrite existing section content
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const force = process.argv.includes('--force');

const L = (en: string, ar: string) => ({ en, ar });

type SectionSeed = {
  key: string;
  order: number;
  content: Record<string, unknown>;
};

const sections: SectionSeed[] = [
  {
    key: 'FEATURES',
    order: 10,
    content: {
      eyebrow: L('A complete learning system', 'منظومة تعلم متكاملة'),
      titleStart: L('Everything you need', 'كل ما تحتاجه'),
      titleAccent: L('to pass USMLE', 'للنجاح في USMLE'),
      subtitle: L(
        'An integrated platform combining medical content, quizzes, flashcards, and review plans in one place',
        'منصة متكاملة تجمع المحتوى الطبي، والاختبارات، والبطاقات الدراسية، وخطط المراجعة في مكان واحد'
      ),
      items: [
        {
          id: 'structuredCourses',
          icon: 'Brain',
          to: '/explore',
          number: '01',
          title: L('Structured courses', 'دورات منظمة'),
          description: L('Systems-based teaching that builds understanding before memorization.', 'تعليم قائم على الأنظمة يبني الفهم قبل الحفظ.'),
        },
        {
          id: 'flashcards',
          icon: 'Layers',
          to: '/login',
          number: '02',
          tone: 'blue',
          title: L('Flashcards', 'بطاقات دراسية'),
          description: L('Spaced review cards to lock in high-yield facts.', 'بطاقات مراجعة متباعدة لتثبيت المعلومات عالية العائد.'),
        },
        {
          id: 'quizzes',
          icon: 'ClipboardCheck',
          to: '/login',
          number: '03',
          tone: 'emerald',
          title: L('Quizzes', 'اختبارات'),
          description: L('Practice questions that reinforce clinical reasoning.', 'أسئلة تدريبية تعزز التفكير السريري.'),
        },
        {
          id: 'studyPlan',
          icon: 'Calendar',
          to: '/login',
          number: '04',
          tone: 'violet',
          title: L('Study plan', 'خطة دراسة'),
          description: L('A clear weekly path so you always know what to do next.', 'مسار أسبوعي واضح لتعرف دائماً الخطوة التالية.'),
        },
      ],
    },
  },
  {
    key: 'HOW_IT_WORKS',
    order: 20,
    content: {
      eyebrow: L('A complete learning experience', 'تجربة تعليمية متكاملة'),
      titleStart: L('Your learning journey', 'رحلتك التعليمية'),
      titleAccent: L('from understanding to confidence', 'من الفهم إلى الثقة'),
      subtitle: L(
        'Yaser USMLE brings content, practice, and progress tracking into one focused learning experience.',
        'تجمع Yaser USMLE المحتوى والتدريب والمتابعة في تجربة تعليمية واحدة تساعدك على الاستعداد بوضوح وثقة.'
      ),
      footerTitle: L('Every learning tool in one focused space', 'كل أدوات تعلمك في مساحة واحدة'),
      footerSubtitle: L('Lessons, assessments, flashcards, and an integrated study plan', 'دروس، اختبارات، فلاش كاردز، وخطة مذاكرة متكاملة'),
      footerCtaLabel: L('Start your journey', 'ابدأ رحلتك'),
      footerCtaHref: '/explore',
      steps: [
        {
          id: 's1',
          number: '01',
          title: L('Choose your path', 'اختر مسارك'),
          description: L('Pick a course or package that matches your stage of Step 1 prep.', 'اختر دورة أو باقة تناسب مرحلتك في التحضير لـ Step 1.'),
        },
        {
          id: 's2',
          number: '02',
          title: L('Learn with structure', 'تعلّم بمنهجية'),
          description: L('Watch lessons, review flashcards, and drill questions by system.', 'شاهد الدروس وراجع البطاقات وتدرّب على الأسئلة حسب النظام.'),
        },
        {
          id: 's3',
          number: '03',
          title: L('Track and improve', 'تتبّع وحسّن'),
          description: L('Use progress tools to focus on weak areas before exam day.', 'استخدم أدوات التتبع للتركيز على نقاط الضعف قبل يوم الامتحان.'),
        },
      ],
    },
  },
  {
    key: 'TESTIMONIALS',
    order: 30,
    content: {
      titlePrefix: L('What Our', 'ماذا يقول'),
      titleAccent: L('Students Say', 'طلابنا؟'),
      subtitle: L(
        'Hear from medical students who improved their foundations, question performance, and study confidence.',
        'استمع إلى طلاب الطب الذين عززوا أساسياتهم وطوروا أداءهم في الأسئلة ودخلوا فترة المراجعة بثقة.'
      ),
      items: [
        {
          id: 't1',
          rating: 5,
          name: L('Yara F.', 'يارا ف.'),
          role: L('Step 1 candidate', 'مرشحة Step 1'),
          text: L('The explanations finally connected physiology to the vignettes.', 'الشروحات ربطت أخيراً بين الفيزيولوجيا والحالات السريرية.'),
        },
        {
          id: 't2',
          rating: 5,
          name: L('Ahmed M.', 'أحمد م.'),
          role: L('Medical student', 'طالب طب'),
          text: L('Quizzes and flashcards keep me consistent every week.', 'الاختبارات والبطاقات تجعلني منتظماً كل أسبوع.'),
        },
        {
          id: 't3',
          rating: 5,
          name: L('Tala H.', 'تالا ح.'),
          role: L('IMG applicant', 'طالبة دولية'),
          text: L('Clear systems paths — I always know what to study next.', 'مسارات أنظمة واضحة — أعرف دائماً ماذا أدرس تالياً.'),
        },
      ],
    },
  },
  {
    key: 'CTA',
    order: 40,
    content: {
      title: L('Start your Step 1 journey today', 'ابدأ رحلتك نحو Step 1 اليوم'),
      subtitle: L('Browse courses and packages built around understanding, practice, and progress.', 'تصفح الدورات والباقات المصممة حول الفهم والتدريب والتقدم.'),
      primaryLabel: L('Browse courses', 'تصفح الدورات'),
      primaryTo: '/explore',
      secondaryLabel: L('View packages', 'عرض الباقات'),
      secondaryTo: '/packages',
    },
  },
  {
    key: 'SEO',
    order: 5,
    content: {
      title: L('USMLE Step 1 Preparation', 'التحضير لامتحان USMLE Step 1'),
      description: L(
        'Prepare for USMLE Step 1 with Yaser USMLE courses, structured systems-based learning, quizzes, flashcards, and study planning tools.',
        'حضّر لامتحان USMLE Step 1 مع دورات ياسر، وتعلم منظم حسب الأنظمة، واختبارات وبطاقات وخطط دراسة.'
      ),
      path: '/',
      ogImage: '',
    },
  },
  {
    key: 'ABOUT_HERO',
    order: 50,
    content: {
      eyebrow: L('Medical learning that starts with understanding', 'تعليم طبي يبدأ بالفهم'),
      heroPrefix: L('Building understanding that leads to', 'نبني الفهم الذي يقود إلى'),
      heroAccent: L('confidence', 'الثقة'),
      subtitle: L(
        'Yaser USMLE helps students move from memorizing facts to applying medical reasoning with clarity.',
        'تساعد منصة ياسر الطلاب على الانتقال من حفظ الحقائق إلى تطبيق التفكير الطبي بوضوح.'
      ),
      heroQuote: L(
        'We do not want you to only memorize the answer—we want you to understand why it is right.',
        'لا نريدك أن تحفظ المعلومة فقط؛ نريدك أن تفهم لماذا هي صحيحة.'
      ),
      primaryCtaLabel: L('Explore courses', 'استكشف الدورات'),
      primaryCtaTo: '/explore',
      secondaryCtaLabel: L('Contact us', 'تواصل معنا'),
      secondaryCtaTo: '/contact',
      teamPhoto: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?q=85&w=1400&auto=format&fit=crop',
    },
  },
  {
    key: 'ABOUT_TEACH',
    order: 51,
    content: {
      eyebrow: L('HOW WE TEACH', 'منهجنا في التعليم'),
      title: L('Every part of the platform serves a clear learning goal', 'كل جزء في المنصة يخدم هدفاً تعليمياً واضحاً'),
      subtitle: L(
        'From concept teaching to practice and progress tracking, the experience is built to create knowledge you can apply.',
        'من طريقة شرح المفاهيم إلى التدريب وقياس التقدم، صممنا التجربة لتساعدك على بناء معرفة قابلة للتطبيق.'
      ),
      items: [
        {
          id: 'at1',
          title: L('Understand before memorizing', 'الفهم قبل الحفظ'),
          description: L(
            'We explain mechanisms and relationships so knowledge becomes logical and easier to recall.',
            'نشرح الآليات والعلاقات حتى تصبح المعلومة منطقية وأسهل في الاسترجاع.'
          ),
        },
        {
          id: 'at2',
          title: L('Systems-based structure', 'تعلم منظم حسب الأنظمة'),
          description: L(
            'Content follows clear paths connecting foundational science with clinical context.',
            'نرتب المحتوى في مسارات واضحة تربط العلوم الأساسية بالسياق السريري.'
          ),
        },
        {
          id: 'at3',
          title: L('Progress you can measure', 'تقدم يمكن قياسه'),
          description: L(
            'Quizzes, flashcards, and study planning show where you stand and what comes next.',
            'الاختبارات والفلاش كاردز وخطة المذاكرة تساعدك على معرفة موقعك والخطوة التالية.'
          ),
        },
      ],
    },
  },
  {
    key: 'ABOUT_JOIN',
    order: 52,
    content: {
      title: L('Join learners preparing with clarity', 'انضم لطلاب يتحضّرون بوضوح'),
      subtitle: L(
        'Start with a path that fits your stage and learn through one experience combining content, practice, and progress.',
        'ابدأ بمسار يناسب مرحلتك، وتعلّم داخل تجربة تجمع المحتوى والتدريب والمتابعة.'
      ),
      primaryCtaLabel: L('Sign up', 'إنشاء حساب'),
      primaryCtaTo: '/signup',
      secondaryCtaLabel: L('FAQ', 'الأسئلة الشائعة'),
      secondaryCtaTo: '/faq',
    },
  },
  {
    key: 'EXPLORE_HERO',
    order: 60,
    content: {
      eyebrow: L('Learning paths built for Step 1', 'مسارات تعليمية مصممة لـ Step 1'),
      titlePrefix: L('Find the course', 'اعثر على الدورة'),
      titleAccent: L('that fits you', 'المناسبة لك'),
      subtitle: L(
        'Browse Yaser USMLE courses and choose the right access option for your Step 1 preparation.',
        'تصفح دورات ياسر USMLE واختر خيار الوصول المناسب لتحضيرك لـ Step 1.'
      ),
      searchPlaceholder: L('Search courses…', 'ابحث عن دورة…'),
      pillars: [
        {
          id: 'ep1',
          title: L('Connected understanding', 'فهم مترابط'),
          body: L('Teaching that connects basic science to clinical reasoning.', 'شرح يربط العلوم الأساسية بالتطبيق السريري.'),
        },
        {
          id: 'ep2',
          title: L('Structured paths', 'مسارات منظمة'),
          body: L('Content organized by systems and preparation stage.', 'محتوى مرتب حسب الأنظمة ومستوى التحضير.'),
        },
        {
          id: 'ep3',
          title: L('Active practice', 'تطبيق مستمر'),
          body: L('Assessments and reviews that reinforce every concept.', 'اختبارات ومراجعات تثبّت ما تتعلمه.'),
        },
      ],
    },
  },
  {
    key: 'PACKAGES_HERO',
    order: 61,
    content: {
      eyebrow: L('More value for a complete learning path', 'قيمة أكبر لمسار تعليمي متكامل'),
      titlePrefix: L('Learning', 'باقات'),
      titleAccent: L('packages', 'تعليمية'),
      subtitle: L('Bundle courses and tools into one plan that fits your timeline.', 'اجمع الدورات والأدوات في خطة واحدة تناسب جدولك.'),
    },
  },
  {
    key: 'INSTRUCTORS_HERO',
    order: 62,
    content: {
      eyebrow: L('Expert instructors', 'مدربون خبراء'),
      titlePrefix: L('Meet our', 'تعرّف على'),
      titleAccent: L('instructors', 'مدرسينا'),
      subtitle: L('Browse profiles, explore their courses, and book a private 1-on-1 session.', 'تصفح الملفات واستكشف دوراتهم واحجز جلسة خاصة.'),
      searchPlaceholder: L('Search by name or specialty…', 'ابحث بالاسم أو التخصص…'),
    },
  },
  {
    key: 'EVENTS_HERO',
    order: 63,
    content: {
      eyebrow: L('Events & News Hub', 'ملتقى الفعاليات والأخبار'),
      titlePrefix: L('Yaser USMLE', 'فعاليات وندوات'),
      titleAccent: L('Events & Seminars', 'Yaser USMLE'),
      subtitle: L(
        'Keep up with the latest USMLE Step 1 seminars, question workshops, and live medical sessions led by expert educators.',
        'تابع أحدث ندوات USMLE Step 1 وورش حل الأسئلة والجلسات الطبية المباشرة مع محاضرين خبراء.'
      ),
      searchPlaceholder: L('Search webinars, seminars, rooms...', 'ابحث عن ندوة، محاضرة أو مكان...'),
    },
  },
  {
    key: 'BLOGS_HERO',
    order: 64,
    content: {
      eyebrow: L('Insights & updates', 'رؤى وتحديثات'),
      titlePrefix: L('Guides for', 'أدلة لـ'),
      titleAccent: L('smarter prep', 'تحضير أذكى'),
      subtitle: L('Articles, study tips, and platform news for Step 1 learners.', 'مقالات ونصائح دراسية وأخبار المنصة لطلاب Step 1.'),
      searchPlaceholder: L('Search articles…', 'ابحث في المقالات…'),
      pillars: [
        { id: 'bp1', title: L('Study strategy', 'استراتيجية الدراسة'), body: L('Practical frameworks for long-term retention.', 'أطر عملية للاحتفاظ طويل الأمد.') },
        { id: 'bp2', title: L('High-yield topics', 'مواضيع عالية العائد'), body: L('Focus where it matters most on exam day.', 'ركّز حيث يهم الأمر يوم الامتحان.') },
        { id: 'bp3', title: L('Platform updates', 'تحديثات المنصة'), body: L('What is new in courses and tools.', 'ما الجديد في الدورات والأدوات.') },
      ],
    },
  },
];

const footerSettings: Array<{ key: string; value: string }> = [
  {
    key: 'FOOTER_TAGLINE_EN',
    value: 'USMLE Step 1 preparation built around understanding, practice, and measurable progress.',
  },
  {
    key: 'FOOTER_TAGLINE_AR',
    value: 'تحضير لامتحان USMLE Step 1 مبني على الفهم والتدريب والتقدم القابل للقياس.',
  },
  { key: 'FOOTER_LOCATION_EN', value: 'Cairo, Egypt' },
  { key: 'FOOTER_LOCATION_AR', value: 'القاهرة، مصر' },
];

async function upsertSection(seed: SectionSeed) {
  const existing = await prisma.homePageSection.findUnique({ where: { key: seed.key } });
  if (existing && !force) {
    console.log(`skip section ${seed.key} (exists; use --force to overwrite)`);
    return;
  }
  await prisma.homePageSection.upsert({
    where: { key: seed.key },
    create: {
      key: seed.key,
      content: seed.content,
      isVisible: true,
      order: seed.order,
    },
    update: {
      content: seed.content,
      isVisible: true,
      order: seed.order,
    },
  });
  console.log(`${existing ? 'updated' : 'created'} section ${seed.key}`);
}

async function upsertSetting(key: string, value: string) {
  const existing = await prisma.platformSetting.findUnique({ where: { key } });
  if (existing && !force) {
    console.log(`skip setting ${key}`);
    return;
  }
  await prisma.platformSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
  console.log(`${existing ? 'updated' : 'created'} setting ${key}`);
}

async function main() {
  for (const section of sections) {
    await upsertSection(section);
  }
  for (const row of footerSettings) {
    await upsertSetting(row.key, row.value);
  }

  // Ensure static CMS pages exist (same as seed-cms-pages)
  console.log('Also ensuring static CMS pages…');
  const { execSync } = await import('node:child_process');
  try {
    execSync('npx tsx scripts/seed-cms-pages.ts', { stdio: 'inherit', cwd: process.cwd() });
  } catch {
    console.warn('Could not run seed-cms-pages.ts — run it separately if needed.');
  }

  console.log('Public CMS seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
