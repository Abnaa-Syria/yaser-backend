import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const pages = [
  {
    slug: 'contact',
    titleEn: 'Contact Us',
    titleAr: 'اتصل بنا',
    subtitleEn: 'We are here to help with courses, billing, and partnerships.',
    subtitleAr: 'نحن هنا للمساعدة في الدورات والفواتير والشراكات.',
    order: 1,
    sectionsEn: [
      { id: 'c1', heading: 'General inquiries', body: 'Reach our team for questions about courses, enrollments, or your account.', listItems: [] },
      { id: 'c2', heading: 'Response time', body: 'We typically respond within one business day.', listItems: [] },
    ],
    sectionsAr: [
      { id: 'c1', heading: 'استفسارات عامة', body: 'تواصل مع فريقنا للأسئلة حول الدورات أو التسجيل أو حسابك.', listItems: [] },
      { id: 'c2', heading: 'وقت الاستجابة', body: 'نرد عادةً خلال يوم عمل واحد.', listItems: [] },
    ],
  },
  {
    slug: 'community',
    titleEn: 'Community',
    titleAr: 'المجتمع',
    subtitleEn: 'Connect with fellow USMLE Step 1 learners and stay updated.',
    subtitleAr: 'تواصل مع زملائك في التحضير لامتحان USMLE Step 1 وابقَ على اطلاع.',
    order: 2,
    sectionsEn: [{ id: 'm1', heading: 'Yaser USMLE Step 1 community', body: 'Join discussions, share study insights, and learn from peers.', listItems: ['Course Q&A', 'Study groups', 'Exam updates'] }],
    sectionsAr: [{ id: 'm1', heading: 'مجتمع ياسر USMLE Step 1', body: 'انضم للنقاشات وشارك خبراتك الدراسية.', listItems: ['أسئلة الدورات', 'مجموعات دراسة', 'تحديثات الامتحان'] }],
  },
  {
    slug: 'library',
    titleEn: 'Resource Library',
    titleAr: 'المكتبة',
    subtitleEn: 'Guides, references, and learning materials for USMLE Step 1.',
    subtitleAr: 'أدلة ومراجع ومواد تعليمية للتحضير لامتحان USMLE Step 1.',
    order: 3,
    sectionsEn: [{ id: 'l1', heading: 'What you will find', body: 'Curated resources to support your Step 1 preparation.', listItems: ['Study checklists', 'Medical references'] }],
    sectionsAr: [{ id: 'l1', heading: 'ما ستجده', body: 'موارد منتقاة لدعم تحضيرك للخطوة الأولى.', listItems: ['قوائم مراجعة دراسية', 'مراجع طبية'] }],
  },
  {
    slug: 'user-guide',
    titleEn: 'User Guide',
    titleAr: 'دليل الاستخدام',
    subtitleEn: 'Everything you need to get started on the platform.',
    subtitleAr: 'كل ما تحتاجه للبدء على المنصة.',
    order: 4,
    sectionsEn: [{ id: 'g1', heading: 'Create your account', body: 'Sign up, verify, and complete your profile.', listItems: [] }],
    sectionsAr: [{ id: 'g1', heading: 'إنشاء حساب', body: 'سجّل، فعّل حسابك، وأكمل ملفك.', listItems: [] }],
  },
  {
    slug: 'terms',
    titleEn: 'Terms & Conditions',
    titleAr: 'الشروط والأحكام',
    subtitleEn: 'Please read these terms before using our services.',
    subtitleAr: 'يرجى قراءة هذه الشروط قبل استخدام خدماتنا.',
    order: 5,
    sectionsEn: [{ id: 't1', heading: 'Use of the platform', body: 'Lawful educational purposes only.', listItems: [] }],
    sectionsAr: [{ id: 't1', heading: 'استخدام المنصة', body: 'للأغراض التعليمية المشروعة فقط.', listItems: [] }],
  },
  {
    slug: 'teach',
    titleEn: 'Become an Instructor',
    titleAr: 'كن معلّمًا',
    subtitleEn: 'Share your medical and USMLE expertise with learners across MENA.',
    subtitleAr: 'شارك خبرتك الطبية وخبرتك في USMLE مع المتعلّمين.',
    order: 6,
    sectionsEn: [{ id: 'i1', heading: 'How to apply', body: 'Send your CV, portfolio, and course outline to our team.', listItems: [] }],
    sectionsAr: [{ id: 'i1', heading: 'كيفية التقديم', body: 'أرسل سيرتك الذاتية ومخطط الدورة.', listItems: [] }],
  },
];

async function main() {
  for (const page of pages) {
    await prisma.cmsPage.upsert({
      where: { slug: page.slug },
      update: page,
      create: { ...page, isPublished: true },
    });
  }
  console.log(`Seeded ${pages.length} CMS pages.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
