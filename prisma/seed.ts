/**
 * Yaser USMLE seed — platform owner IS the instructor.
 * Dr. Yaser (SUPER_ADMIN) owns all courses. Not a multi-instructor marketplace.
 */
import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const DEMO_ORIGIN = 'https://demo.yaserusmle.com';
const now = new Date();
const days = (offset: number) => new Date(now.getTime() + offset * 86_400_000);
const hours = (offset: number) => new Date(now.getTime() + offset * 3_600_000);

const permissions = [
  'user:manage', 'user:permission:grant', 'role:manage', 'course:manage', 'course:review',
  'course:staff:manage', 'curriculum:manage', 'exam:manage', 'flashcard:manage',
  'class:manage', 'enrollment:manage', 'finance:manage', 'payment:manage', 'payout:manage',
  'subscription:manage', 'coupon:manage', 'instructor:manage',
  'instructor_application:manage', 'support:manage', 'cms:manage', 'settings:manage',
  'audit:read', 'dashboard:read', 'category:manage',
  'certificate:manage', 'event:manage',
] as const;

const rolePermissions: Record<string, readonly string[]> = {
  SUPER_ADMIN: permissions,
  ADMIN: permissions.filter((permission) => permission !== 'user:permission:grant'),
  INSTRUCTOR: ['course:manage', 'curriculum:manage', 'exam:manage', 'flashcard:manage', 'class:manage', 'dashboard:read'],
  TEACHING_ASSISTANT: ['course:manage', 'exam:manage', 'flashcard:manage'],
  CONTENT_REVIEWER: ['course:review', 'course:manage', 'flashcard:manage'],
  FINANCIAL_MANAGER: ['finance:manage', 'payment:manage', 'payout:manage', 'subscription:manage', 'coupon:manage', 'dashboard:read'],
  TECHNICAL_SUPPORT: ['support:manage', 'user:manage', 'dashboard:read'],
  STUDENT: [],
};

type CourseFixture = {
  title: string;
  titleAr: string;
  slug: string;
  category: string;
  instructor: number;
  status: 'APPROVED' | 'DRAFT' | 'PENDING_REVIEW' | 'REJECTED';
  publishStatus: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  price: number;
  featured?: boolean;
  units: Array<{ title: string; titleAr: string; lessons: Array<[string, string]> }>;
};

const courseFixtures: CourseFixture[] = [
  {
    title: 'Cardiovascular Physiology & Pathology', titleAr: 'فسيولوجيا وأمراض القلب والأوعية',
    slug: 'step-1-cardiovascular', category: 'Organ Systems', instructor: 0, status: 'APPROVED',
    publishStatus: 'PUBLISHED', price: 129, featured: true,
    units: [
      { title: 'Cardiac Physiology', titleAr: 'فسيولوجيا القلب', lessons: [['Pressure-Volume Loops', 'حلقات الضغط والحجم'], ['Heart Sounds and Murmurs', 'أصوات القلب والنفخات']] },
      { title: 'Cardiovascular Disease', titleAr: 'أمراض القلب والأوعية', lessons: [['Ischemic Heart Disease', 'مرض القلب الإقفاري'], ['Heart Failure Pharmacology', 'أدوية قصور القلب']] },
    ],
  },
  {
    title: 'Renal Physiology & Acid-Base', titleAr: 'فسيولوجيا الكلى والتوازن الحمضي القاعدي',
    slug: 'step-1-renal', category: 'Organ Systems', instructor: 0, status: 'APPROVED',
    publishStatus: 'PUBLISHED', price: 119, featured: true,
    units: [
      { title: 'Nephron Fundamentals', titleAr: 'أساسيات النفرون', lessons: [['Glomerular Filtration', 'الترشيح الكبيبي'], ['Tubular Transport', 'النقل الأنبوبي']] },
      { title: 'Clinical Renal', titleAr: 'الكلى السريرية', lessons: [['Acid-Base Disorders', 'اضطرابات الحمض والقاعدة'], ['Diuretics', 'مدرات البول']] },
    ],
  },
  {
    title: 'Microbiology & Antimicrobials', titleAr: 'الأحياء الدقيقة ومضادات الميكروبات',
    slug: 'step-1-microbiology', category: 'Foundational Sciences', instructor: 0, status: 'APPROVED',
    publishStatus: 'PUBLISHED', price: 139,
    units: [
      { title: 'Bacteriology', titleAr: 'علم الجراثيم', lessons: [['Gram-Positive Organisms', 'الجراثيم موجبة الغرام'], ['Gram-Negative Organisms', 'الجراثيم سالبة الغرام']] },
      { title: 'Antimicrobial Therapy', titleAr: 'العلاج المضاد للميكروبات', lessons: [['Cell Wall Inhibitors', 'مثبطات جدار الخلية'], ['Resistance Mechanisms', 'آليات المقاومة']] },
    ],
  },
  {
    title: 'Immunology High-Yield Review', titleAr: 'مراجعة المناعة عالية العائد',
    slug: 'step-1-immunology', category: 'Foundational Sciences', instructor: 0, status: 'APPROVED',
    publishStatus: 'PUBLISHED', price: 99,
    units: [{ title: 'Immune Response', titleAr: 'الاستجابة المناعية', lessons: [['Innate and Adaptive Immunity', 'المناعة الفطرية والمكتسبة'], ['Hypersensitivity Reactions', 'تفاعلات فرط الحساسية']] }],
  },
  {
    title: 'Neuroscience & Behavioral Science', titleAr: 'علوم الأعصاب والعلوم السلوكية',
    slug: 'step-1-neuroscience', category: 'Organ Systems', instructor: 0, status: 'APPROVED',
    publishStatus: 'PUBLISHED', price: 149,
    units: [{ title: 'Neuroanatomy', titleAr: 'التشريح العصبي', lessons: [['Brainstem Lesions', 'آفات جذع الدماغ'], ['Major CNS Pathways', 'المسارات الرئيسية للجهاز العصبي المركزي']] }],
  },
  {
    title: 'Biochemistry & Medical Genetics', titleAr: 'الكيمياء الحيوية والوراثة الطبية',
    slug: 'step-1-biochemistry-genetics', category: 'Foundational Sciences', instructor: 0,
    status: 'PENDING_REVIEW', publishStatus: 'DRAFT', price: 109,
    units: [{ title: 'Molecular Medicine', titleAr: 'الطب الجزيئي', lessons: [['DNA Replication and Repair', 'تضاعف وإصلاح الحمض النووي'], ['Inheritance Patterns', 'أنماط الوراثة']] }],
  },
  {
    title: 'General Pharmacology Foundations', titleAr: 'أساسيات علم الأدوية العام',
    slug: 'step-1-pharmacology', category: 'Pharmacology', instructor: 0, status: 'DRAFT',
    publishStatus: 'DRAFT', price: 89,
    units: [{ title: 'Pharmacokinetics', titleAr: 'الحركية الدوائية', lessons: [['Drug Clearance and Half-Life', 'تصفية الدواء ونصف العمر'], ['Dose-Response Curves', 'منحنيات الجرعة والاستجابة']] }],
  },
  {
    title: 'Rapid Anatomy Recall', titleAr: 'مراجعة سريعة للتشريح',
    slug: 'step-1-rapid-anatomy', category: 'Foundational Sciences', instructor: 0, status: 'REJECTED',
    publishStatus: 'DRAFT', price: 69,
    units: [{ title: 'Anatomy Review', titleAr: 'مراجعة التشريح', lessons: [['Upper Limb Nerves', 'أعصاب الطرف العلوي'], ['Abdominal Blood Supply', 'التروية الدموية للبطن']] }],
  },
];

function assertDestructiveSeedAllowed() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to run destructive seed with NODE_ENV=production.');
  }
  if (process.env.ALLOW_DESTRUCTIVE_SEED !== 'true') {
    throw new Error('Destructive seed blocked. Set ALLOW_DESTRUCTIVE_SEED=true after verifying DATABASE_URL.');
  }
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) throw new Error('DATABASE_URL is required.');
  const url = new URL(rawUrl);
  const database = decodeURIComponent(url.pathname.replace(/^\//, '')) || '(none)';
  console.log(`Authorized destructive seed target: host=${url.hostname}, database=${database}`);
}

async function wipeDatabase() {
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');
  try {
    const tables = await prisma.$queryRawUnsafe<Array<{ TABLE_NAME: string }>>(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME <> '_prisma_migrations'"
    );
    for (const { TABLE_NAME } of tables) {
      if (!/^[A-Za-z0-9_]+$/.test(TABLE_NAME)) throw new Error(`Unsafe table name returned: ${TABLE_NAME}`);
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${TABLE_NAME}\``);
    }
  } finally {
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');
  }
}

async function main() {
  assertDestructiveSeedAllowed();
  await wipeDatabase();
  console.log('Seeding bilingual Yaser USMLE Step 1 demo data...');

  const permissionRows = await Promise.all(
    permissions.map((action) => prisma.permission.create({ data: { action, description: `Allows ${action}` } }))
  );
  const permissionId = Object.fromEntries(permissionRows.map((row) => [row.action, row.id]));
  const roles: Record<string, string> = {};
  for (const [name, actions] of Object.entries(rolePermissions)) {
    const role = await prisma.role.create({
      data: {
        name, description: `${name.replaceAll('_', ' ')} system role`, isSystemRole: true,
        permissions: { create: actions.map((action) => ({ permissionId: permissionId[action] })) },
      },
    });
    roles[name] = role.id;
  }
  const mentorRole = await prisma.role.create({
    data: {
      name: 'STUDY_MENTOR', description: 'Custom role for supervised Step 1 study planning',
      permissions: { create: ['dashboard:read', 'class:manage'].map((action) => ({ permissionId: permissionId[action] })) },
    },
  });

  const password = await bcrypt.hash('Password123!', 12);
  const createUser = (data: Omit<Prisma.UserUncheckedCreateInput, 'password'>) =>
    prisma.user.create({ data: { ...data, password } });
  const superAdmin = await createUser({ email: 'superadmin@yaserusmle.com', fullName: 'Ops Superuser', roleId: roles.ADMIN, isActive: true });
  const admin = await createUser({ email: 'admin@yaserusmle.com', fullName: 'Mariam Adel', roleId: roles.ADMIN, isActive: true });
  const finance = await createUser({ email: 'finance@yaserusmle.com', fullName: 'Omar Nabil', roleId: roles.FINANCIAL_MANAGER, isActive: true });
  const support = await createUser({ email: 'support@yaserusmle.com', fullName: 'Nour Samir', roleId: roles.TECHNICAL_SUPPORT, isActive: true });
  const reviewer = await createUser({ email: 'reviewer@yaserusmle.com', fullName: 'Dr. Lina Mostafa', roleId: roles.CONTENT_REVIEWER, isActive: true });
  const ta = await createUser({ email: 'ta@yaserusmle.com', fullName: 'Ahmed Tarek', roleId: roles.TEACHING_ASSISTANT, academicLevel: 'GRADUATE', isActive: true });
  const mentor = await createUser({ email: 'mentor@yaserusmle.com', fullName: 'Salma Study Mentor', roleId: mentorRole.id, academicLevel: 'GRADUATE', isActive: true });

  // Platform owner = sole teacher (SUPER_ADMIN). All courses belong to this user.
  const platformOwner = await createUser({
    email: 'dr.yaser@yaserusmle.com',
    fullName: 'Dr. Yaser',
    bio: 'Founder and lead educator at Yaser USMLE — mechanism-first Step 1 teaching in English and Arabic. المؤسس والمحاضر الرئيسي — تعليم قائم على الفهم.',
    experience: 12,
    commissionRate: 100,
    averageRating: 4.9,
    roleId: roles.SUPER_ADMIN,
    isActive: true,
  });
  const instructors = [platformOwner];

  const studentData = [
    ['student@yaserusmle.com', 'Demo Student', 'IMG'], ['fatma@yaserusmle.com', 'Fatma Ali', 'PRE_CLINICAL'],
    ['youssef@yaserusmle.com', 'Youssef Ibrahim', 'CLINICAL'], ['nour.student@yaserusmle.com', 'Nour Mahmoud', 'IMG'],
    ['khaled@yaserusmle.com', 'Khaled Mostafa', 'GRADUATE'], ['layla@yaserusmle.com', 'Layla Farouk', 'PRE_CLINICAL'],
    ['hassan@yaserusmle.com', 'Hassan Nabil', 'CLINICAL'], ['mariam@yaserusmle.com', 'Mariam Saeed', 'IMG'],
    ['tarek@yaserusmle.com', 'Tarek Youssef', 'GRADUATE'], ['dina@yaserusmle.com', 'Dina Hossam', 'PRE_CLINICAL'],
    ['raneem@yaserusmle.com', 'Raneem Fathy', 'CLINICAL'], ['ali@yaserusmle.com', 'Ali Wael', 'IMG'],
  ] as const;
  const students = await Promise.all(studentData.map(([email, fullName, academicLevel], index) =>
    createUser({
      email, fullName, academicLevel, roleId: roles.STUDENT, phone: `+201000000${String(index + 1).padStart(3, '0')}`,
      isActive: index !== studentData.length - 1, lastLoginAt: days(-index),
    })
  ));
  await prisma.userPermission.create({ data: { userId: mentor.id, permissionId: permissionId['course:manage'], expiresAt: days(30) } });
  await prisma.userPermission.create({ data: { userId: ta.id, permissionId: permissionId['dashboard:read'], expiresAt: days(-2) } });

  const categoryDefs = [
    ['Foundational Sciences', 'العلوم الأساسية', 'foundational-sciences', 'Atom'],
    ['Organ Systems', 'أجهزة الجسم', 'organ-systems', 'HeartPulse'],
    ['Pharmacology', 'علم الأدوية', 'pharmacology', 'Pill'],
    ['Question Strategy', 'استراتيجية الأسئلة', 'question-strategy', 'ListChecks'],
  ] as const;
  const categories = await Promise.all(categoryDefs.map(([name, nameAr, slug, icon], index) =>
    prisma.category.create({
      data: {
        name, nameAr, slug, icon, displayOrder: index + 1, status: 'PUBLISHED',
        description: `USMLE Step 1 ${name.toLowerCase()} curriculum`,
        descriptionAr: `منهج ${nameAr} لامتحان USMLE Step 1`,
        seoTitle: `${name} | Yaser USMLE`, seoTitleAr: `${nameAr} | ياسر USMLE`,
      },
    })
  ));
  const categoryId = Object.fromEntries(categories.map((category) => [category.name, category.id]));

  const courses: Array<{ id: string }> = [];
  const allLessons: Array<{ id: string; courseId: string; unitId: string; title: string }> = [];
  for (let courseIndex = 0; courseIndex < courseFixtures.length; courseIndex += 1) {
    const fixture = courseFixtures[courseIndex];
    const course = await prisma.course.create({
      data: {
        title: fixture.title, titleAr: fixture.titleAr, slug: fixture.slug,
        shortDescription: `Focused, high-yield USMLE Step 1 review of ${fixture.title.toLowerCase()}.`,
        shortDescriptionAr: `مراجعة مركزة وعالية العائد في ${fixture.titleAr}.`,
        description: `Learn core mechanisms, clinical vignettes, and exam reasoning for ${fixture.title}.`,
        descriptionAr: `تعلّم الآليات الأساسية والحالات السريرية ومنهجية حل أسئلة ${fixture.titleAr}.`,
        thumbnail: `${DEMO_ORIGIN}/assets/courses/${fixture.slug}.webp`,
        coverImage: `${DEMO_ORIGIN}/assets/courses/${fixture.slug}-cover.webp`,
        introVideoUrl: `${DEMO_ORIGIN}/media/previews/${fixture.slug}.mp4`,
        categoryId: categoryId[fixture.category], instructorId: instructors[fixture.instructor].id,
        price: fixture.price, type: 'RECORDED',
        status: fixture.status, publishStatus: fixture.publishStatus,
        isActive: fixture.status === 'APPROVED', isFeatured: fixture.featured ?? false,
        displayOrder: courseIndex + 1, targetLevels: ['PRE_CLINICAL', 'CLINICAL', 'IMG'],
        seoTitle: `${fixture.title} for USMLE Step 1`, seoTitleAr: `${fixture.titleAr} لامتحان USMLE Step 1`,
        seoDescription: `Bilingual USMLE Step 1 course covering ${fixture.title}.`,
        seoDescriptionAr: `دورة ثنائية اللغة تغطي ${fixture.titleAr}.`,
        seoKeywords: `USMLE Step 1, ${fixture.slug.replaceAll('-', ', ')}`,
        reviewedById: fixture.status === 'APPROVED' || fixture.status === 'REJECTED' ? reviewer.id : null,
        reviewNotes: fixture.status === 'PENDING_REVIEW' ? 'Verify Arabic captions and question references.' : null,
        rejectionReason: fixture.status === 'REJECTED' ? 'Expand learning objectives and add clinically oriented assessments.' : null,
      },
    });
    courses.push(course);
    await prisma.coursePricingTier.createMany({
      data: [
        { courseId: course.id, name: 'THREE_MONTHS', nameAr: 'ثلاثة أشهر', label: 'Focused access', labelAr: 'وصول مركز', price: fixture.price * 0.55, originalPrice: fixture.price * 0.65, durationValue: 3, durationUnit: 'MONTH', durationDays: 90, displayOrder: 1, description: 'Ninety-day course access', descriptionAr: 'وصول للدورة لمدة تسعين يوماً' },
        { courseId: course.id, name: 'LIFETIME', nameAr: 'مدى الحياة', label: 'Lifetime access', labelAr: 'وصول مدى الحياة', price: fixture.price, durationUnit: 'LIFETIME', displayOrder: 2, badge: courseIndex < 2 ? 'POPULAR' : null, description: 'Unlimited access to future updates', descriptionAr: 'وصول غير محدود مع التحديثات المستقبلية' },
      ],
    });
    for (let unitIndex = 0; unitIndex < fixture.units.length; unitIndex += 1) {
      const unitFixture = fixture.units[unitIndex];
      const unit = await prisma.unit.create({
        data: {
          courseId: course.id, title: unitFixture.title, titleAr: unitFixture.titleAr,
          slug: `${fixture.slug}-unit-${unitIndex + 1}`, order: unitIndex + 1,
          description: `High-yield ${unitFixture.title} concepts and clinical integration.`,
          descriptionAr: `مفاهيم عالية العائد في ${unitFixture.titleAr} مع التكامل السريري.`,
          imageUrl: `${DEMO_ORIGIN}/assets/units/${fixture.slug}-${unitIndex + 1}.webp`,
          status: fixture.publishStatus === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
        },
      });
      const section = await prisma.section.create({ data: { unitId: unit.id, title: 'Core Concepts | المفاهيم الأساسية', order: 1 } });
      for (let lessonIndex = 0; lessonIndex < unitFixture.lessons.length; lessonIndex += 1) {
        const [title, titleAr] = unitFixture.lessons[lessonIndex];
        const lesson = await prisma.lesson.create({
          data: {
            sectionId: section.id, title, titleAr, slug: `${fixture.slug}-lesson-${unitIndex + 1}-${lessonIndex + 1}`,
            description: `Mechanisms, clinical correlations, and board-style checkpoints for ${title}.`,
            descriptionAr: `الآليات والروابط السريرية وأسئلة المراجعة حول ${titleAr}.`,
            content: `High-yield learning notes for ${title}.`, contentAr: `ملخص تعليمي عالي العائد حول ${titleAr}.`,
            order: lessonIndex + 1, durationSeconds: 1500 + lessonIndex * 300,
            videoUrl: `${DEMO_ORIGIN}/media/lessons/${fixture.slug}-${unitIndex + 1}-${lessonIndex + 1}.m3u8`,
            isPreview: unitIndex === 0 && lessonIndex === 0, status: fixture.publishStatus === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
          },
        });
        allLessons.push({ id: lesson.id, courseId: course.id, unitId: unit.id, title });
      }
    }
  }

  await prisma.courseStaff.createMany({
    data: [
      { courseId: courses[0].id, userId: ta.id, role: 'TEACHING_ASSISTANT' },
      { courseId: courses[0].id, userId: reviewer.id, role: 'CONTENT_REVIEWER' },
      { courseId: courses[2].id, userId: ta.id, role: 'TEACHING_ASSISTANT' },
    ],
  });
  await prisma.lessonResource.createMany({
    data: [
      { lessonId: allLessons[0].id, title: 'Pressure-volume loop summary', titleAr: 'ملخص حلقة الضغط والحجم', fileUrl: `${DEMO_ORIGIN}/resources/pv-loop-summary.pdf`, fileType: 'PDF', mimeType: 'application/pdf', fileSizeBytes: 420000, resourceType: 'PDF', order: 1 },
      { lessonId: allLessons[0].id, title: 'Cardiac cycle diagram', titleAr: 'رسم دورة القلب', fileUrl: `${DEMO_ORIGIN}/resources/cardiac-cycle.webp`, fileType: 'WEBP', mimeType: 'image/webp', resourceType: 'IMAGE', order: 2 },
      { lessonId: allLessons[1].id, title: 'Murmur audio guide', titleAr: 'دليل أصوات النفخات', externalUrl: `${DEMO_ORIGIN}/library/murmur-audio`, resourceType: 'LINK', isDownloadable: false, order: 1 },
      { lessonId: allLessons[4].id, title: 'Renal equations handout', titleAr: 'ورقة معادلات الكلى', fileUrl: `${DEMO_ORIGIN}/resources/renal-equations.docx`, fileType: 'DOCX', resourceType: 'DOCUMENT', order: 1 },
      { lessonId: allLessons[8].id, title: 'Microbiology lecture slides', titleAr: 'شرائح محاضرة الأحياء الدقيقة', fileUrl: `${DEMO_ORIGIN}/resources/microbiology-slides.pptx`, fileType: 'PPTX', resourceType: 'PPT', order: 1 },
      { lessonId: allLessons[2].id, title: 'Ischemia video stream', titleAr: 'فيديو نقص التروية', fileUrl: `${DEMO_ORIGIN}/media/lessons/ischemia.m3u8`, fileType: 'HLS', resourceType: 'VIDEO_HLS', order: 1 },
    ],
  });

  await prisma.flashcard.createMany({
    data: [
      { lessonId: allLessons[0].id, front: 'What increases afterload?', frontAr: 'ما الذي يزيد الحمل البعدي؟', back: 'Increased systemic vascular resistance.', backAr: 'زيادة المقاومة الوعائية الجهازية.', explanation: 'Afterload approximates aortic pressure.', explanationAr: 'يقارب الحمل البعدي ضغط الأبهر.', displayOrder: 1, status: 'PUBLISHED', createdById: instructors[0].id },
      { lessonId: allLessons[4].id, front: 'What determines GFR?', frontAr: 'ما الذي يحدد معدل الترشيح الكبيبي؟', back: 'Net filtration pressure and Kf.', backAr: 'ضغط الترشيح الصافي ومعامل الترشيح.', displayOrder: 1, status: 'PUBLISHED', createdById: instructors[0].id },
      { lessonId: allLessons[9].id, front: 'Beta-lactam resistance mechanism?', frontAr: 'آلية مقاومة البيتا لاكتام؟', back: 'Beta-lactamase or altered penicillin-binding proteins.', backAr: 'إنزيم بيتا لاكتاماز أو تغير بروتينات ارتباط البنسلين.', displayOrder: 1, status: 'DRAFT', createdById: ta.id },
    ],
  });
  await prisma.flashcard.createMany({
    data: allLessons.slice(0, 12).map((lesson, index) => ({
      lessonId: lesson.id,
      front: `High-yield checkpoint ${index + 1}: ${lesson.title}`,
      frontAr: `نقطة مراجعة عالية العائد ${index + 1}: ${lesson.title}`,
      back: `Recall the core mechanism and one board-style clinical correlation for ${lesson.title}.`,
      backAr: `استرجع الآلية الأساسية ورابطاً سريرياً واحداً بنمط أسئلة البورد حول ${lesson.title}.`,
      explanation: 'Use active recall before returning to the lesson notes.',
      explanationAr: 'استخدم الاسترجاع النشط قبل الرجوع إلى ملخص الدرس.',
      displayOrder: index + 2,
      status: index === 11 ? 'ARCHIVED' as const : 'PUBLISHED' as const,
      createdById: instructors[0].id,
    })),
  });

  const package1 = await prisma.coursePackage.create({
    data: {
      title: 'Step 1 Systems Core Bundle', titleAr: 'باقة أجهزة الجسم الأساسية',
      slug: 'step-1-systems-core', shortDescription: 'Cardiovascular, renal, and neuroscience review.',
      shortDescriptionAr: 'مراجعة القلب والكلى وعلوم الأعصاب.', description: 'Integrated organ-system preparation with bilingual lessons.',
      descriptionAr: 'تحضير متكامل لأجهزة الجسم بدروس ثنائية اللغة.',
      coverImage: `${DEMO_ORIGIN}/assets/packages/systems-core.webp`, price: 299, originalPrice: 397,
      publishStatus: 'PUBLISHED', isFeatured: true, displayOrder: 1,
      seoTitle: 'USMLE Step 1 Systems Bundle', seoTitleAr: 'باقة أجهزة USMLE Step 1',
      seoDescription: 'Three high-yield Step 1 systems courses.', seoDescriptionAr: 'ثلاث دورات عالية العائد لأجهزة الجسم.',
    },
  });
  const package2 = await prisma.coursePackage.create({
    data: {
      title: 'Foundations Accelerator', titleAr: 'باقة تسريع العلوم الأساسية',
      slug: 'step-1-foundations-accelerator', shortDescription: 'Microbiology, immunology, and biochemistry.',
      shortDescriptionAr: 'الأحياء الدقيقة والمناعة والكيمياء الحيوية.', price: 249, originalPrice: 347,
      coverImage: `${DEMO_ORIGIN}/assets/packages/foundations.webp`, publishStatus: 'PUBLISHED', displayOrder: 2,
    },
  });
  const package3 = await prisma.coursePackage.create({
    data: {
      title: 'Upcoming Comprehensive Step 1 Bundle', titleAr: 'باقة Step 1 الشاملة القادمة',
      slug: 'step-1-comprehensive-upcoming', shortDescription: 'Draft bundle used to review upcoming content and pricing.',
      shortDescriptionAr: 'باقة مسودة لمراجعة المحتوى والأسعار القادمة.',
      description: 'Includes upcoming biochemistry, genetics, and pharmacology courses after editorial approval.',
      descriptionAr: 'تضم دورات الكيمياء الحيوية والوراثة وعلم الأدوية بعد اعتمادها تحريرياً.',
      coverImage: `${DEMO_ORIGIN}/assets/packages/comprehensive-upcoming.webp`, price: 179,
      originalPrice: 218, publishStatus: 'DRAFT', isActive: false, displayOrder: 3,
    },
  });
  await prisma.coursePackageItem.createMany({
    data: [
      { packageId: package1.id, courseId: courses[0].id }, { packageId: package1.id, courseId: courses[1].id },
      { packageId: package1.id, courseId: courses[4].id }, { packageId: package2.id, courseId: courses[2].id },
      { packageId: package2.id, courseId: courses[3].id }, { packageId: package3.id, courseId: courses[5].id },
      { packageId: package3.id, courseId: courses[6].id },
    ],
  });
  const packageTiers = await Promise.all([
    prisma.coursePackagePricingTier.create({ data: { packageId: package1.id, name: 'SIX_MONTHS', nameAr: 'ستة أشهر', label: 'Exam season', labelAr: 'موسم الامتحان', price: 199, originalPrice: 249, durationValue: 6, durationUnit: 'MONTH', durationDays: 180, displayOrder: 1, description: 'Six-month bundle access', descriptionAr: 'وصول للباقة لمدة ستة أشهر' } }),
    prisma.coursePackagePricingTier.create({ data: { packageId: package1.id, name: 'LIFETIME', nameAr: 'مدى الحياة', label: 'Lifetime', labelAr: 'مدى الحياة', price: 299, originalPrice: 397, durationUnit: 'LIFETIME', displayOrder: 2 } }),
    prisma.coursePackagePricingTier.create({ data: { packageId: package2.id, name: 'ONE_YEAR', nameAr: 'سنة واحدة', price: 249, durationValue: 1, durationUnit: 'YEAR', durationDays: 365, displayOrder: 1 } }),
  ]);

  const monthlyPlan = await prisma.subscriptionPlan.create({ data: { name: 'Step 1 Monthly Review', description: 'Monthly access for focused revision.', price: 39, durationMonths: 1, isActive: true } });
  const annualPlan = await prisma.subscriptionPlan.create({ data: { name: 'Step 1 Annual Review', description: 'Twelve months of full review access.', price: 329, durationMonths: 12, isActive: true, isRecommended: true } });
  const inactivePlan = await prisma.subscriptionPlan.create({ data: { name: 'Archived Three-Month Review', description: 'Inactive historical offering.', price: 99, durationMonths: 3, isActive: false } });
  const subscriptions = await Promise.all([
    prisma.userSubscription.create({ data: { studentId: students[0].id, planId: annualPlan.id, startDate: days(-20), endDate: days(345), status: 'ACTIVE', autoRenew: true } }),
    prisma.userSubscription.create({ data: { studentId: students[1].id, planId: monthlyPlan.id, startDate: days(-45), endDate: days(-15), status: 'EXPIRED' } }),
    prisma.userSubscription.create({ data: { studentId: students[2].id, planId: monthlyPlan.id, startDate: days(0), endDate: days(30), status: 'PENDING_PAYMENT' } }),
    prisma.userSubscription.create({ data: { studentId: students[3].id, planId: inactivePlan.id, startDate: days(-120), endDate: days(-30), status: 'CANCELED' } }),
  ]);

  const availabilityOpen = await prisma.instructorAvailability.create({ data: { instructorId: instructors[0].id, startTime: days(5), endTime: new Date(days(5).getTime() + 3_600_000), price: 75, status: 'AVAILABLE' } });
  const availabilityBooked = await prisma.instructorAvailability.create({ data: { instructorId: instructors[0].id, startTime: days(7), endTime: new Date(days(7).getTime() + 3_600_000), price: 65, status: 'BOOKED' } });

  const courseTier = await prisma.coursePricingTier.findFirstOrThrow({ where: { courseId: courses[0].id, name: 'LIFETIME' } });
  const paymentCourse = await prisma.payment.create({
    data: {
      studentId: students[0].id, courseId: courses[0].id, pricingTierId: courseTier.id,
      amount: courseTier.price, currency: 'USD', status: 'PAID', paymentMethod: 'card',
      receiptUrl: `${DEMO_ORIGIN}/demo-receipts/course-paid.pdf`, paidAt: days(-30), activatedAt: days(-30),
      accessStartsAt: days(-30), reviewedById: finance.id, reviewedAt: days(-30),
      paymentDestinationSnapshot: { provider: 'DemoPay', accountLabel: 'Yaser USMLE USD' },
      priceSnapshot: { tier: 'LIFETIME', subtotal: courseTier.price, discount: 0, total: courseTier.price },
      gatewaySessionId: 'demo_session_course_001', gatewayPaymentId: 'demo_payment_course_001',
    },
  });
  const paymentPackage = await prisma.payment.create({
    data: {
      studentId: students[1].id, coursePackageId: package1.id, coursePackagePricingTierId: packageTiers[0].id,
      amount: packageTiers[0].price, status: 'PAID', paymentMethod: 'bank_transfer',
      receiptUrl: `${DEMO_ORIGIN}/demo-receipts/package-paid.pdf`, paidAt: days(-10), activatedAt: days(-10),
      accessStartsAt: days(-10), accessExpiresAt: days(170), reviewedById: finance.id, reviewedAt: days(-9),
      priceSnapshot: { tier: 'SIX_MONTHS', total: packageTiers[0].price },
    },
  });
  const paymentSubscription = await prisma.payment.create({
    data: { studentId: students[2].id, subscriptionId: subscriptions[2].id, amount: monthlyPlan.price, status: 'PENDING', paymentMethod: 'bank_transfer', receiptUrl: `${DEMO_ORIGIN}/demo-receipts/subscription-pending.jpg`, studentNote: 'Transfer submitted for review.' },
  });
  const paymentPrivate = await prisma.payment.create({
    data: { studentId: students[4].id, availabilityId: availabilityBooked.id, amount: 65, status: 'PAID', paymentMethod: 'wallet', paidAt: days(-1), activatedAt: days(-1), reviewedById: finance.id, reviewedAt: days(-1) },
  });
  const paymentFailed = await prisma.payment.create({
    data: { studentId: students[5].id, courseId: courses[2].id, amount: 139, status: 'FAILED', paymentMethod: 'card', rejectionReason: 'Demo card authorization was declined.' },
  });
  const paymentRefunded = await prisma.payment.create({
    data: { studentId: students[6].id, courseId: courses[3].id, amount: 99, status: 'REFUNDED', paymentMethod: 'card', paidAt: days(-25), adminNote: 'Refund approved within the demo policy window.' },
  });
  const historicalPaymentFixtures = [
    { studentId: students[7].id, courseId: courses[2].id, amount: 139, offset: -150 },
    { studentId: students[8].id, courseId: courses[3].id, amount: 99, offset: -120 },
    { studentId: students[9].id, courseId: courses[4].id, amount: 149, offset: -90 },
    { studentId: students[10].id, courseId: courses[1].id, amount: 119, offset: -60 },
    { studentId: students[11].id, courseId: courses[0].id, amount: 129, offset: -30 },
  ];
  const historicalPayments = await Promise.all(historicalPaymentFixtures.map((fixture, index) =>
    prisma.payment.create({
      data: {
        studentId: fixture.studentId, courseId: fixture.courseId, amount: fixture.amount,
        status: 'PAID', paymentMethod: 'card', paidAt: days(fixture.offset),
        createdAt: days(fixture.offset), activatedAt: days(fixture.offset),
        accessStartsAt: days(fixture.offset), reviewedById: finance.id,
        reviewedAt: days(fixture.offset), gatewaySessionId: `demo_historical_session_${index + 1}`,
        gatewayPaymentId: `demo_historical_payment_${index + 1}`,
      },
    })
  ));
  await prisma.paymentWebhookEvent.createMany({
    data: [
      { gatewayEventId: 'evt_demo_paid_001', status: 'PROCESSED', gatewayProvider: 'DemoPay', eventType: 'payment.succeeded', paymentId: paymentCourse.id, payload: { paymentId: 'demo_payment_course_001', amount: courseTier.price }, processedAt: days(-30) },
      { gatewayEventId: 'evt_demo_pending_001', status: 'PENDING', gatewayProvider: 'DemoPay', eventType: 'payment.processing', paymentId: paymentSubscription.id, payload: { review: 'manual' } },
      { gatewayEventId: 'evt_demo_failed_001', status: 'FAILED', gatewayProvider: 'DemoPay', eventType: 'payment.failed', paymentId: paymentFailed.id, payload: { code: 'declined' }, errorMessage: 'Demo authorization declined.' },
      { gatewayEventId: 'evt_demo_skipped_001', status: 'SKIPPED', gatewayProvider: 'DemoPay', eventType: 'customer.updated', payload: { reason: 'not actionable' }, processedAt: days(-2) },
    ],
  });

  await prisma.coursePurchase.createMany({
    data: [
      { studentId: students[0].id, courseId: courses[0].id, paymentId: paymentCourse.id, pricingTierId: courseTier.id, accessStartsAt: days(-30), activatedAt: days(-30), progressPercentage: 75, completedLessonsCount: 3 },
      { studentId: students[1].id, courseId: courses[0].id, paymentId: paymentPackage.id, accessStartsAt: days(-10), activatedAt: days(-10), expiresAt: days(170), progressPercentage: 50, completedLessonsCount: 2 },
      { studentId: students[1].id, courseId: courses[1].id, paymentId: paymentPackage.id, accessStartsAt: days(-10), activatedAt: days(-10), expiresAt: days(170), progressPercentage: 25, completedLessonsCount: 1 },
      { studentId: students[1].id, courseId: courses[4].id, paymentId: paymentPackage.id, accessStartsAt: days(-10), activatedAt: days(-10), expiresAt: days(170) },
      { studentId: students[6].id, courseId: courses[3].id, paymentId: paymentRefunded.id, progressPercentage: 100, completedLessonsCount: 2, isCompleted: true, expiresAt: days(-1) },
      ...historicalPaymentFixtures.map((fixture, index) => ({
        studentId: fixture.studentId, courseId: fixture.courseId, paymentId: historicalPayments[index].id,
        accessStartsAt: days(fixture.offset), activatedAt: days(fixture.offset),
      })),
    ],
  });
  await prisma.coursePackagePurchase.create({ data: { studentId: students[1].id, packageId: package1.id, pricingTierId: packageTiers[0].id, paymentId: paymentPackage.id, accessStartsAt: days(-10), activatedAt: days(-10), expiresAt: days(170) } });

  await prisma.lessonProgress.createMany({
    data: [
      { studentId: students[0].id, lessonId: allLessons[0].id, courseId: courses[0].id, isCompleted: true, completedAt: days(-20), watchPercentage: 100, timeSpentSeconds: 1800, lastWatchedPosition: 1800 },
      { studentId: students[0].id, lessonId: allLessons[1].id, courseId: courses[0].id, isCompleted: true, completedAt: days(-18), watchPercentage: 100, timeSpentSeconds: 1900, lastWatchedPosition: 1800 },
      { studentId: students[0].id, lessonId: allLessons[2].id, courseId: courses[0].id, isCompleted: true, completedAt: days(-12), watchPercentage: 100, timeSpentSeconds: 1700, lastWatchedPosition: 1500 },
      { studentId: students[0].id, lessonId: allLessons[3].id, courseId: courses[0].id, watchPercentage: 35, timeSpentSeconds: 600, lastWatchedPosition: 525 },
      { studentId: students[1].id, lessonId: allLessons[0].id, courseId: courses[0].id, isCompleted: true, completedAt: days(-5), watchPercentage: 100, timeSpentSeconds: 1600, lastWatchedPosition: 1500 },
      { studentId: students[1].id, lessonId: allLessons[1].id, courseId: courses[0].id, isCompleted: true, completedAt: days(-4), watchPercentage: 100, timeSpentSeconds: 1700, lastWatchedPosition: 1500 },
      { studentId: students[1].id, lessonId: allLessons[4].id, courseId: courses[1].id, isCompleted: true, completedAt: days(-3), watchPercentage: 100, timeSpentSeconds: 1700, lastWatchedPosition: 1500 },
      { studentId: students[6].id, lessonId: allLessons[12].id, courseId: courses[3].id, isCompleted: true, completedAt: days(-35), watchPercentage: 100, timeSpentSeconds: 1500, lastWatchedPosition: 1500 },
      { studentId: students[6].id, lessonId: allLessons[13].id, courseId: courses[3].id, isCompleted: true, completedAt: days(-30), watchPercentage: 100, timeSpentSeconds: 1700, lastWatchedPosition: 1500 },
    ],
  });
  await prisma.studentPlaybackNote.createMany({
    data: [
      { studentId: students[0].id, sourceType: 'RECORDED_LESSON', sourceId: allLessons[0].id, content: 'Increased afterload shifts the end-systolic point upward and right.', timestampSeconds: 540 },
    ],
  });

  const mcqOptions = [
    { id: 'opt-a', text: 'Increased systemic vascular resistance', textAr: 'زيادة المقاومة الوعائية الجهازية' },
    { id: 'opt-b', text: 'Increased ventricular compliance', textAr: 'زيادة مطاوعة البطين' },
    { id: 'opt-c', text: 'Decreased aortic pressure', textAr: 'انخفاض ضغط الأبهر' },
    { id: 'opt-d', text: 'Decreased blood viscosity', textAr: 'انخفاض لزوجة الدم' },
  ];
  const tfOptions = [
    { id: 'true', text: 'True', textAr: 'صحيح' },
    { id: 'false', text: 'False', textAr: 'خطأ' },
  ];
  const finalExam = await prisma.exam.create({
    data: {
      title: 'Cardiovascular Systems Assessment', titleAr: 'اختبار جهاز القلب والأوعية',
      description: 'Board-style cardiovascular mechanisms and vignettes.', descriptionAr: 'أسئلة نمط البورد في آليات وحالات القلب.',
      status: 'AVAILABLE', type: 'FINAL', courseId: courses[0].id, durationMinutes: 60,
      totalPoints: 30, passingScore: 18, attempts: 2, targetLevels: ['IMG', 'CLINICAL'],
      coveredTopics: ['Hemodynamics', 'Murmurs', 'Heart failure'], examStructure: { multipleChoice: 1, trueFalse: 1, shortAnswer: 1 },
      importantInstructions: ['Choose one answer for each MCQ', 'Use mechanism-first reasoning'],
      preparationTips: ['Review pressure-volume loops'], readyMessage: 'You are ready when you can explain each hemodynamic change.',
      questions: {
        create: [
          { questionText: 'Which change most directly increases left ventricular afterload?', questionTextAr: 'أي تغير يزيد الحمل البعدي للبطين الأيسر مباشرة؟', type: 'MULTIPLE_CHOICE', points: 10, order: 1, options: mcqOptions, correctAnswer: 'opt-a', explanation: 'Systemic vascular resistance opposes ventricular ejection.', explanationAr: 'المقاومة الوعائية الجهازية تعاكس قذف البطين.' },
          { questionText: 'Handgrip increases the intensity of mitral regurgitation.', questionTextAr: 'تزيد مناورة قبض اليد شدة نفخة ارتجاع الصمام التاجي.', type: 'TRUE_FALSE', points: 10, order: 2, options: tfOptions, correctAnswer: 'true', explanation: 'Handgrip raises afterload and regurgitant flow.', explanationAr: 'تزيد قبضة اليد الحمل البعدي وتدفق الارتجاع.' },
          { questionText: 'Name the first-line chronic mortality-reducing drug class for HFrEF.', questionTextAr: 'اذكر فئة دوائية أولية تقلل الوفيات في قصور القلب الانقباضي.', type: 'SHORT_ANSWER', points: 10, order: 3, correctAnswer: 'ARNI or ACE inhibitor', explanation: 'RAAS inhibition reduces remodeling and mortality.', explanationAr: 'يثبط نظام الرينين أنجيوتنسين ويقلل إعادة التشكيل والوفيات.' },
        ],
      },
    },
    include: { questions: true },
  });
  await prisma.exam.create({ data: { title: 'Renal Unit Checkpoint', titleAr: 'اختبار وحدة الكلى', status: 'UPCOMING', type: 'UNIT', courseId: courses[1].id, unitId: allLessons[4].unitId, scheduledAt: days(4), durationMinutes: 25, totalPoints: 10, passingScore: 6, questions: { create: [{ questionText: 'Inulin clearance equals GFR.', questionTextAr: 'تصفية الإينولين تساوي معدل الترشيح الكبيبي.', type: 'TRUE_FALSE', points: 10, order: 1, options: tfOptions, correctAnswer: 'true', explanation: 'Inulin is freely filtered and neither secreted nor reabsorbed.', explanationAr: 'يترشح الإينولين بحرية ولا يفرز أو يعاد امتصاصه.' }] } } });
  await prisma.exam.create({ data: { title: 'Microbiology Lesson Quiz', titleAr: 'اختبار درس الأحياء الدقيقة', status: 'COMPLETED', type: 'LESSON', courseId: courses[2].id, lessonId: allLessons[8].id, durationMinutes: 10, totalPoints: 5, passingScore: 3 } });
  await prisma.exam.create({ data: { title: 'Step 1 Readiness Diagnostic', titleAr: 'اختبار تشخيص الجاهزية لـ Step 1', status: 'EXPIRED', type: 'STANDALONE', scheduledAt: days(-60), durationMinutes: 90, totalPoints: 100, passingScore: 60 } });
  const submittedExam = await prisma.examSubmission.create({ data: { studentId: students[0].id, examId: finalExam.id, attempt: 1, startedAt: days(-3), submittedAt: days(-3), totalScore: 26, isPassed: true } });
  await prisma.examAnswer.createMany({
    data: finalExam.questions.map((question) => ({
      submissionId: submittedExam.id, questionId: question.id,
      answerText: question.type === 'MULTIPLE_CHOICE' ? 'opt-a' : question.type === 'TRUE_FALSE' ? 'true' : 'ACE inhibitor',
      isCorrect: true, pointsEarned: question.type === 'SHORT_ANSWER' ? 6 : 10,
    })),
  });
  await prisma.examSubmission.create({ data: { studentId: students[1].id, examId: finalExam.id, attempt: 1, startedAt: days(-1) } });

  const question = await prisma.lessonQuestion.create({
    data: { lessonId: allLessons[0].id, studentId: students[0].id, title: 'Why does contractility shift the ESPVR?', body: 'I understand the graph movement but not the cellular mechanism.', isResolved: true },
  });
  await prisma.lessonAnswer.createMany({
    data: [
      { questionId: question.id, userId: instructors[0].id, body: 'Increased intracellular calcium increases force at a given end-diastolic volume, steepening ESPVR.', isInstructorReply: true },
      { questionId: question.id, userId: students[1].id, body: 'Connecting calcium to force generation made the graph easier for me too.' },
    ],
  });
  const answeredQuestion = await prisma.lessonQuestion.create({
    data: { lessonId: allLessons[4].id, studentId: students[1].id, title: 'How should I distinguish RPF from GFR?', body: 'I mix up the clearance markers in question stems.' },
  });
  await prisma.lessonAnswer.create({
    data: { questionId: answeredQuestion.id, userId: instructors[0].id, body: 'Anchor GFR to inulin and effective RPF to PAH, then compare filtration fraction.', isInstructorReply: true },
  });
  await prisma.lessonQuestion.create({
    data: { lessonId: allLessons[8].id, studentId: students[2].id, title: 'When is a capsule most testable?', body: 'Which encapsulated organisms should I prioritize for Step 1 review?' },
  });
  await prisma.wishlist.createMany({ data: [{ studentId: students[0].id, courseId: courses[2].id }, { studentId: students[3].id, courseId: courses[0].id }, { studentId: students[4].id, courseId: courses[4].id }] });

  const studyPlan = await prisma.studyPlan.create({
    data: { studentId: students[0].id, title: 'Eight-Week Step 1 Systems Sprint', goal: 'Finish cardiovascular and renal systems with 80% assessment scores.', targetDate: days(56) },
  });
  await prisma.studyPlanItem.createMany({
    data: [
      { planId: studyPlan.id, title: 'Complete pressure-volume loops lesson', scheduledAt: days(-2), status: 'DONE', completedAt: days(-2), priority: 3, order: 1, courseId: courses[0].id, unitId: allLessons[0].unitId, lessonId: allLessons[0].id },
      { planId: studyPlan.id, title: 'Review renal filtration unit', notes: 'Create an equation sheet.', scheduledAt: days(1), status: 'IN_PROGRESS', priority: 2, order: 2, courseId: courses[1].id, unitId: allLessons[4].unitId },
      { planId: studyPlan.id, title: 'Take cardiovascular assessment', scheduledAt: days(5), status: 'TODO', priority: 3, order: 3, courseId: courses[0].id },
      { planId: studyPlan.id, title: 'Optional immunology recap', scheduledAt: days(7), status: 'SKIPPED', priority: 1, order: 4, courseId: courses[3].id },
    ],
  });
  await prisma.studyPlan.create({ data: { studentId: students[1].id, title: 'Archived Foundation Review', goal: 'Initial plan before switching schedules.', targetDate: days(-30), isArchived: true } });

  await prisma.courseReview.createMany({
    data: [
      { courseId: courses[0].id, studentId: students[0].id, rating: 5, comment: 'The bilingual explanations made hemodynamics finally click.', isFeatured: true },
      { courseId: courses[0].id, studentId: students[1].id, rating: 4, comment: 'Excellent vignettes and clear diagrams.' },
      { courseId: courses[1].id, studentId: students[1].id, rating: 5, comment: 'The acid-base framework is concise and reliable.' },
    ],
  });
  await prisma.instructorReview.createMany({
    data: [
      { instructorId: instructors[0].id, studentId: students[0].id, rating: 5, comment: 'Clear mechanism-first teaching.', isFeaturedOnHome: true },
      { instructorId: instructors[0].id, studentId: students[1].id, rating: 5, comment: 'Excellent renal explanations.' },
      { instructorId: instructors[0].id, studentId: students[2].id, rating: 4, comment: 'Memorable microbiology comparisons.' },
    ],
  });
  await prisma.studentPerformance.createMany({
    data: [
      { studentId: students[0].id, courseId: courses[0].id, averageGrade: 92, averageExamScore: 86.7 },
      { studentId: students[1].id, courseId: courses[0].id, averageGrade: 78, averageExamScore: 0 },
      { studentId: students[1].id, courseId: courses[1].id, averageGrade: 84, averageExamScore: 72 },
    ],
  });

  const wallets = [
    await prisma.wallet.create({
      data: {
        instructorId: instructors[0].id,
        balance: 243.2,
        currency: 'USD',
        totalEarned: 543.2,
        totalWithdrawn: 300,
      },
    }),
  ];
  const creditTx1 = await prisma.walletTransaction.create({ data: { walletId: wallets[0].id, type: 'EARNING', amount: 129, description: 'Cardiovascular course sale instructor credit', sourcePaymentId: paymentCourse.id } });
  const creditTx2 = await prisma.walletTransaction.create({ data: { walletId: wallets[0].id, type: 'EARNING', amount: 65, description: 'Private study consultation instructor credit', sourcePaymentId: paymentPrivate.id } });
  await prisma.walletTransaction.createMany({
    data: [
      { walletId: wallets[0].id, type: 'EARNING', amount: 349.2, description: 'Prior verified Step 1 course earnings' },
      { walletId: wallets[0].id, type: 'WITHDRAWAL', amount: -300, description: 'Paid bank payout' },
    ],
  });
  await prisma.paymentInstructorCredit.createMany({
    data: [
      { paymentId: paymentCourse.id, instructorId: instructors[0].id, amount: 129, rateApplied: 100, reason: 'COURSE_RECORDED', walletTransactionId: creditTx1.id },
      { paymentId: paymentPrivate.id, instructorId: instructors[0].id, amount: 65, rateApplied: 100, reason: 'PRIVATE_SESSION', walletTransactionId: creditTx2.id },
    ],
  });
  await prisma.payoutRequest.createMany({
    data: [
      { instructorId: instructors[0].id, amount: 100, status: 'PENDING', payoutMethod: 'bank_transfer', payoutDetails: JSON.stringify({ bank: 'Demo National Bank', account: '****1201' }) },
      { instructorId: instructors[0].id, amount: 80, status: 'APPROVED', payoutMethod: 'bank_transfer', payoutDetails: JSON.stringify({ bank: 'Demo National Bank', account: '****1201' }), adminNotes: 'Approved for next settlement.' },
      { instructorId: instructors[0].id, amount: 150, status: 'PAID', payoutMethod: 'bank_transfer', payoutDetails: JSON.stringify({ bank: 'Demo National Bank', account: '****1201' }), receiptUrl: `${DEMO_ORIGIN}/demo-receipts/payout-001.pdf`, processedAt: days(-7) },
    ],
  });

  const ticket = await prisma.supportTicket.create({ data: { creatorId: students[0].id, assignedToId: support.id, subject: 'Lesson recording pauses during playback', status: 'IN_PROGRESS', priority: 'HIGH', relatedEntityType: 'LESSON', relatedEntityId: allLessons[0].id } });
  await prisma.ticketMessage.createMany({
    data: [
      { ticketId: ticket.id, senderId: students[0].id, message: 'The recording pauses near 27 minutes on two devices.' },
      { ticketId: ticket.id, senderId: support.id, message: 'We reproduced the issue and are rebuilding the demo stream.' },
      { ticketId: ticket.id, senderId: support.id, message: 'Internal: media manifest regeneration requested.', isInternal: true },
    ],
  });
  await prisma.supportTicket.createMany({
    data: [
      { creatorId: students[1].id, assignedToId: support.id, subject: 'Package payment awaiting review', status: 'OPEN', priority: 'MEDIUM', relatedEntityType: 'PAYMENT', relatedEntityId: paymentPackage.id },
      { creatorId: students[2].id, assignedToId: support.id, subject: 'Update certificate display name', status: 'RESOLVED', priority: 'LOW' },
      { creatorId: instructors[0].id, assignedToId: finance.id, subject: 'Payout routing details', status: 'CLOSED', priority: 'URGENT' },
    ],
  });
  await prisma.notification.createMany({
    data: [
      { userId: students[0].id, type: 'EXAM_AVAILABLE', title: 'Assessment available', message: 'The cardiovascular systems assessment is ready.', entityType: 'EXAM', entityId: finalExam.id },
      { userId: students[0].id, type: 'GRADE_POSTED', title: 'Grade posted', message: 'Your cardiovascular assessment score is available.', entityType: 'EXAM', entityId: finalExam.id, isRead: true },
      { userId: students[1].id, type: 'SUBSCRIPTION_EXPIRING', title: 'Review access ended', message: 'Your monthly review subscription has expired.' },
      { userId: instructors[0].id, type: 'GENERAL', title: 'New learner question', message: 'A learner asked about pressure-volume loops.', entityType: 'LESSON_QUESTION', entityId: question.id },
    ],
  });

  await prisma.certificate.createMany({
    data: [
      { serialNumber: 'YU-STEP1-2026-0001', studentId: students[0].id, courseId: courses[0].id, examId: finalExam.id, issuedById: admin.id, title: 'Cardiovascular Systems Mastery', pdfUrl: `${DEMO_ORIGIN}/certificates/YU-STEP1-2026-0001.pdf`, issuedAt: days(-2) },
      { serialNumber: 'YU-STEP1-2026-0002', studentId: students[6].id, courseId: courses[3].id, issuedById: admin.id, title: 'Immunology High-Yield Review Completion', pdfUrl: `${DEMO_ORIGIN}/certificates/YU-STEP1-2026-0002.pdf`, issuedAt: days(-20) },
    ],
  });

  const coupon = await prisma.coupon.create({ data: { code: 'STEP1START', description: '15% off a first Step 1 course', discountType: 'PERCENTAGE', discountValue: 15, appliesTo: 'COURSE', maxUses: 200, usedCount: 1, maxUsesPerUser: 1, expiresAt: days(90), eligibleCourses: { create: [{ courseId: courses[0].id }, { courseId: courses[1].id }] } } });
  await prisma.coupon.createMany({ data: [{ code: 'REVIEW25', description: 'Twenty-five dollars off review access', discountType: 'FIXED', discountValue: 25, appliesTo: 'SUBSCRIPTION', maxUses: 50, isActive: true }, { code: 'EXPIREDSTEP1', description: 'Expired demonstration promotion', discountType: 'PERCENTAGE', discountValue: 10, appliesTo: 'BOTH', isActive: false, expiresAt: days(-30) }] });
  await prisma.couponUsage.create({ data: { couponId: coupon.id, userId: students[0].id, targetType: 'COURSE', targetId: courses[0].id, discountApplied: 19.35, usedAt: days(-30) } });

  await prisma.homePageSection.createMany({
    data: [
      { key: 'HERO', order: 1, content: { headline: { en: 'Understand Step 1. Do not just memorize it.', ar: 'افهم Step 1 ولا تكتفِ بالحفظ.' }, subheadline: { en: 'Bilingual mechanism-first teaching and board-style practice.', ar: 'شرح ثنائي اللغة قائم على الفهم وتدريب بنمط البورد.' } } },
      { key: 'ABOUT_US', order: 2, content: { mission: { en: 'Make high-quality Step 1 teaching accessible to Arabic-speaking medical learners.', ar: 'إتاحة تعليم Step 1 عالي الجودة لطلاب الطب الناطقين بالعربية.' }, vision: { en: 'Confident clinical reasoning built from strong foundations.', ar: 'استدلال سريري واثق مبني على أسس قوية.' } } },
      { key: 'FAQ', order: 3, content: [{ id: 'faq-1', question: { en: 'Is the content bilingual?', ar: 'هل المحتوى ثنائي اللغة؟' }, answer: { en: 'Yes. Core lessons and study aids include English and Arabic.', ar: 'نعم، تتضمن الدروس الأساسية ووسائل المراجعة الإنجليزية والعربية.' } }] },
    ],
  });
  for (const page of [
    ['about', 'About Yaser USMLE', 'عن ياسر USMLE'], ['contact', 'Contact Us', 'تواصل معنا'],
    ['privacy', 'Privacy Policy', 'سياسة الخصوصية'], ['terms', 'Terms and Conditions', 'الشروط والأحكام'],
    ['refund-policy', 'Refund Policy', 'سياسة الاسترداد'], ['teach', 'Teach With Us', 'درّس معنا'],
    ['user-guide', 'Platform User Guide', 'دليل استخدام المنصة'],
  ] as const) {
    await prisma.cmsPage.create({ data: { slug: page[0], titleEn: page[1], titleAr: page[2], subtitleEn: 'Yaser USMLE Step 1 learning platform', subtitleAr: 'منصة ياسر التعليمية للتحضير لـ Step 1', sectionsEn: [{ id: `${page[0]}-en`, heading: page[1], body: 'Clear information for medical learners and educators.', listItems: [] }], sectionsAr: [{ id: `${page[0]}-ar`, heading: page[2], body: 'معلومات واضحة للطلاب والمحاضرين في المجال الطبي.', listItems: [] }], isPublished: true } });
  }
  await prisma.post.createMany({
    data: [
      { title: 'A Mechanism-First Approach to Cardiac Murmurs', titleAr: 'منهج قائم على الفهم لنفخات القلب', slug: 'mechanism-first-cardiac-murmurs', content: { blocks: [{ type: 'paragraph', text: 'Start with pressure gradients, timing, and flow direction.' }] }, contentAr: { blocks: [{ type: 'paragraph', text: 'ابدأ بفروق الضغط والتوقيت واتجاه التدفق.' }] }, thumbnail: `${DEMO_ORIGIN}/assets/posts/cardiac-murmurs.webp`, published: true, category: 'STEP1_GUIDE', authorId: instructors[0].id },
      { title: 'How to Review an Incorrect Question', titleAr: 'كيف تراجع السؤال الخاطئ', slug: 'review-incorrect-question', content: { blocks: [{ type: 'paragraph', text: 'Classify the miss as knowledge, interpretation, or execution.' }] }, contentAr: { blocks: [{ type: 'paragraph', text: 'صنّف الخطأ إلى معرفة أو تفسير أو تنفيذ.' }] }, thumbnail: `${DEMO_ORIGIN}/assets/posts/question-review.webp`, published: true, category: 'STUDY_STRATEGY', authorId: admin.id },
      { title: 'Draft: New Genetics Workshop', titleAr: 'مسودة: ورشة الوراثة الجديدة', slug: 'draft-genetics-workshop', content: { blocks: [] }, contentAr: { blocks: [] }, published: false, category: 'NEWS', authorId: reviewer.id },
    ],
  });
  await prisma.banner.createMany({ data: [{ title: 'Start Your Step 1 Systems Review', imageUrl: `${DEMO_ORIGIN}/assets/banners/systems-review.webp`, link: '/courses', isActive: true, order: 1 }, { title: 'Live Acid-Base Workshop', imageUrl: `${DEMO_ORIGIN}/assets/banners/acid-base.webp`, link: '/events', isActive: true, order: 2 }, { title: 'Past Demo Campaign', imageUrl: `${DEMO_ORIGIN}/assets/banners/archive.webp`, isActive: false, order: 3 }] });
  const siteOrigin = process.env.PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://www.alienparts.online';
  await prisma.platformSetting.createMany({
    data: [
      { key: 'SITE_NAME', value: 'Yaser USMLE' },
      { key: 'CONTACT_EMAIL', value: 'hello@yaserusmle.com' },
      { key: 'PHONE_NUMBER', value: '+201159007543' },
      { key: 'SUPPORT_PHONE', value: '+201159007543' },
      { key: 'DEFAULT_CURRENCY', value: 'USD' },
      { key: 'MAINTENANCE_MODE', value: false },
      { key: 'MAX_TRUSTED_DEVICES', value: 3 },
      { key: 'LOGO_PRIMARY_URL', value: `${siteOrigin}/assets/brand/logo-primary.svg` },
      { key: 'LOGO_LIGHT_URL', value: `${siteOrigin}/assets/brand/logo-light.svg` },
      { key: 'LOGO_MARK_URL', value: `${siteOrigin}/assets/brand/logo-mark.svg` },
      { key: 'SOCIAL_INSTAGRAM_URL', value: 'https://www.instagram.com/yaserusmle' },
      { key: 'SOCIAL_TWITTER_URL', value: 'https://x.com/yaserusmle' },
      { key: 'SOCIAL_FACEBOOK_URL', value: 'https://www.facebook.com/yaserusmle' },
      { key: 'SOCIAL_LINKEDIN_URL', value: 'https://www.linkedin.com/company/yaserusmle' },
      { key: 'TRIAL_ENABLED', value: true },
      { key: 'TRIAL_DURATION_DAYS', value: 3 },
      { key: 'TRIAL_POPUP_ENABLED', value: true },
      { key: 'TRIAL_TITLE', value: 'Try Yaser USMLE free' },
      { key: 'TRIAL_TITLE_AR', value: 'جرّب ياسر USMLE مجاناً' },
      { key: 'TRIAL_SUBTITLE', value: 'Explore selected courses without creating an account.' },
      { key: 'TRIAL_SUBTITLE_AR', value: 'استكشف كورسات مختارة بدون إنشاء حساب.' },
      { key: 'TRIAL_CTA_LABEL', value: 'Start free trial' },
      { key: 'TRIAL_CTA_LABEL_AR', value: 'ابدأ التجربة المجانية' },
      { key: 'TRIAL_DISMISS_DAYS', value: 7 },
    ],
  });

  // Guest trial catalog — first published fixture courses
  const trialCourseIds = courseFixtures
    .map((fixture, index) => ({ fixture, id: courses[index]?.id }))
    .filter((row) => row.id && row.fixture.status === 'APPROVED' && row.fixture.publishStatus === 'PUBLISHED')
    .slice(0, 3)
    .map((row) => row.id as string);
  if (trialCourseIds.length > 0) {
    await prisma.trialCourse.createMany({
      data: trialCourseIds.map((courseId, index) => ({
        courseId,
        displayOrder: index + 1,
        isActive: true,
      })),
    });
  }
  await prisma.emailTemplate.createMany({
    data: [
      {
        name: 'WELCOME_EMAIL',
        subject: 'Welcome to Yaser USMLE',
        body: '<h1>Welcome {{name}}</h1><p>Your Step 1 workspace is ready.</p>',
      },
      {
        name: 'PAYMENT_APPROVED',
        subject: 'Your learning access is active — {{course_title}}',
        body: '<p>Hi {{student_name}},</p><p>Your payment of <strong>{{amount}}</strong> for <strong>{{course_title}}</strong> was approved.</p><p><a href="{{learn_url}}">Start learning</a></p>',
      },
      {
        name: 'PAYMENT_REJECTED',
        subject: 'Payment update — {{course_title}}',
        body: '<p>Hi {{student_name}},</p><p>Your payment of <strong>{{amount}}</strong> for <strong>{{course_title}}</strong> was not approved.</p><p>Reason: {{rejection_reason}}</p><p>Contact us: {{contact_email}}</p>',
      },
    ],
  });

  await prisma.contactSubmission.createMany({ data: [{ name: 'Aya Mahmoud', email: 'aya.demo@example.org', subject: 'Course language', message: 'Are all cardiovascular lesson notes available in Arabic?', status: 'NEW' }, { name: 'Mohamed Adel', email: 'mohamed.demo@example.org', subject: 'Institutional access', message: 'We would like information for a student study group.', status: 'READ' }, { name: 'Rana Hisham', email: 'rana.demo@example.org', subject: 'Resolved inquiry', message: 'Thank you for the quick answer.', status: 'ARCHIVED' }] });
  await prisma.instructorApplication.createMany({ data: [{ name: 'Dr. Hala Amin', email: 'hala.demo@example.org', specialty: 'Pathology', experience: 'Seven years teaching integrated pathology.', message: 'I would like to develop a pathology question course.', documentUrl: `${DEMO_ORIGIN}/demo-applications/hala-cv.pdf`, status: 'NEW' }, { name: 'Dr. Samer Ali', email: 'samer.demo@example.org', specialty: 'Endocrinology', experience: 'Clinical educator and question writer.', message: 'Application under review.', documentUrl: `${DEMO_ORIGIN}/demo-applications/samer-cv.pdf`, status: 'REVIEWING', reviewedById: reviewer.id, reviewedAt: days(-2) }, { name: 'Dr. Dalia Fawzy', email: 'dalia.demo@example.org', specialty: 'Pathophysiology', experience: 'Ten years in medical education.', message: 'Accepted demo application.', status: 'ACCEPTED', reviewedById: admin.id, reviewedAt: days(-10), adminNotes: 'Schedule sample lecture.' }, { name: 'Dr. Basel Omar', email: 'basel.demo@example.org', specialty: 'General Biology', experience: 'Limited board-style teaching samples.', message: 'Rejected demo application.', status: 'REJECTED', reviewedById: reviewer.id, reviewedAt: days(-20), adminNotes: 'Request stronger USMLE-specific teaching evidence before reapplying.' }, { name: 'Dr. Nader Demo', email: 'nader.demo@example.org', specialty: 'General Medicine', experience: 'Two years.', message: 'Archived application.', status: 'ARCHIVED', reviewedById: admin.id, reviewedAt: days(-90) }] });
  await prisma.communityEvent.createMany({ data: [{ titleEn: 'Step 1 Question Review Night', titleAr: 'ليلة مراجعة أسئلة Step 1', descriptionEn: 'A live community review of high-yield integrated questions.', descriptionAr: 'مراجعة مجتمعية مباشرة لأسئلة تكاملية عالية العائد.', eventDate: days(14), location: 'Online', bannerUrl: `${DEMO_ORIGIN}/assets/events/question-night.webp`, isActive: true }, { titleEn: 'Study Planning Workshop', titleAr: 'ورشة تخطيط المذاكرة', descriptionEn: 'Build a realistic eight-week systems schedule.', descriptionAr: 'أنشئ جدولاً واقعياً لمراجعة الأجهزة خلال ثمانية أسابيع.', eventDate: days(-30), location: 'Online', bannerUrl: `${DEMO_ORIGIN}/assets/events/study-plan.webp`, isActive: false }] });
  await prisma.platformSocialLink.createMany({ data: [{ platform: 'YOUTUBE', url: 'https://www.youtube.com/@yaserusmle', isActive: true }, { platform: 'TELEGRAM', url: 'https://t.me/yaserusmle', isActive: true }, { platform: 'INSTAGRAM', url: 'https://www.instagram.com/yaserusmle', isActive: true }, { platform: 'X', url: 'https://x.com/yaserusmle', isActive: false }] });

  const device1 = await prisma.userDevice.create({ data: { studentId: students[0].id, deviceFingerprint: 'demo-win-chrome-001', deviceName: 'Windows Study Laptop', os: 'Windows 11', isTrusted: true } });
  const device2 = await prisma.userDevice.create({ data: { studentId: students[0].id, deviceFingerprint: 'demo-ios-safari-001', deviceName: 'iPhone', os: 'iOS 18', isTrusted: true } });
  await prisma.userSession.createMany({ data: [{ studentId: students[0].id, deviceId: device1.id, ipAddress: '192.0.2.10', userAgent: 'Demo Chrome on Windows', isActive: true, lastHeartbeatAt: now }, { studentId: students[0].id, deviceId: device2.id, ipAddress: '198.51.100.20', userAgent: 'Demo Safari on iOS', isActive: false, lastHeartbeatAt: days(-3) }] });
  await prisma.auditLog.createMany({ data: [{ userId: superAdmin.id, action: 'ROLE_CREATED', entityType: 'ROLE', entityId: mentorRole.id, details: { role: 'STUDY_MENTOR' }, ipAddress: '127.0.0.1' }, { userId: reviewer.id, action: 'COURSE_APPROVED', entityType: 'COURSE', entityId: courses[0].id, details: { status: { before: 'PENDING_REVIEW', after: 'APPROVED' } } }, { userId: finance.id, action: 'PAYMENT_APPROVED', entityType: 'PAYMENT', entityId: paymentPackage.id, details: { targetType: 'COURSE_PACKAGE', amount: paymentPackage.amount } }, { userId: support.id, action: 'TICKET_UPDATED', entityType: 'SUPPORT_TICKET', entityId: ticket.id, details: { status: 'IN_PROGRESS' } }, { userId: admin.id, action: 'CERTIFICATE_ISSUED', entityType: 'CERTIFICATE', details: { serialNumber: 'YU-STEP1-2026-0001' } }] });

  await assertSeedIntegrity();
  console.log('Seed complete (owner = instructor). Demo password: Password123!');
  console.log('Platform owner/teacher: dr.yaser@yaserusmle.com (SUPER_ADMIN)');
}

async function assertSeedIntegrity() {
  const counts = {
    roles: await prisma.role.count(), users: await prisma.user.count(), instructors: await prisma.user.count({ where: { role: { name: 'INSTRUCTOR' } } }),
    students: await prisma.user.count({ where: { role: { name: 'STUDENT' } } }), courses: await prisma.course.count(),
    lessons: await prisma.lesson.count(), resources: await prisma.lessonResource.count(), flashcards: await prisma.flashcard.count(), packages: await prisma.coursePackage.count(),
    purchases: await prisma.coursePurchase.count(),
    examQuestions: await prisma.examQuestion.count(), payments: await prisma.payment.count(), notifications: await prisma.notification.count(),
  };
  const requiredMinimums: Partial<Record<keyof typeof counts, number>> = { roles: 9, users: 20, instructors: 0, students: 12, courses: 8, lessons: 20, resources: 6, flashcards: 15, packages: 3, purchases: 10, examQuestions: 4, payments: 11, notifications: 4 };
  for (const [key, minimum] of Object.entries(requiredMinimums)) {
    if (counts[key as keyof typeof counts] < minimum) throw new Error(`Seed integrity failed: ${key} below ${minimum}.`);
  }
  const ownerCourses = await prisma.course.count({ where: { instructor: { email: 'dr.yaser@yaserusmle.com' } } });
  if (ownerCourses !== counts.courses) throw new Error(`Seed integrity failed: all courses must belong to platform owner Dr. Yaser (${ownerCourses}/${counts.courses}).`);
  if (counts.instructors !== 0) throw new Error('Seed integrity failed: INSTRUCTOR role users should be 0 (owner is SUPER_ADMIN).');
  const invalidOptions = await prisma.examQuestion.findMany({ where: { type: { in: ['MULTIPLE_CHOICE', 'TRUE_FALSE'] } }, select: { id: true, options: true, correctAnswer: true } });
  for (const question of invalidOptions) {
    if (!Array.isArray(question.options)) throw new Error(`Seed integrity failed: question ${question.id} options are not an array.`);
    const ids = (question.options as Array<{ id?: unknown }>).map((option) => option.id);
    if (!ids.includes(question.correctAnswer)) throw new Error(`Seed integrity failed: question ${question.id} correctAnswer is not an option id.`);
  }
  const inconsistentProgress = await prisma.lessonProgress.count({ where: { OR: [{ watchPercentage: { lt: 0 } }, { watchPercentage: { gt: 100 } }, { isCompleted: true, watchPercentage: { lt: 100 } }] } });
  if (inconsistentProgress) throw new Error(`Seed integrity failed: ${inconsistentProgress} inconsistent lesson progress rows.`);
  const orphanCredits = await prisma.paymentInstructorCredit.count({ where: { walletTransactionId: null } });
  if (orphanCredits) throw new Error(`Seed integrity failed: ${orphanCredits} instructor credits lack wallet transactions.`);
  const seededWallets = await prisma.wallet.findMany({ include: { transactions: true } });
  for (const wallet of seededWallets) {
    const earned = wallet.transactions
      .filter((transaction) => transaction.type === 'EARNING')
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const withdrawn = Math.abs(wallet.transactions
      .filter((transaction) => transaction.type === 'WITHDRAWAL')
      .reduce((sum, transaction) => sum + transaction.amount, 0));
    const tolerance = 0.001;
    if (Math.abs(earned - wallet.totalEarned) > tolerance ||
        Math.abs(withdrawn - wallet.totalWithdrawn) > tolerance ||
        Math.abs(earned - withdrawn - wallet.balance) > tolerance) {
      throw new Error(`Seed integrity failed: wallet ${wallet.id} totals do not reconcile.`);
    }
  }
  const badCertificates = await prisma.certificate.count({ where: { NOT: { serialNumber: { startsWith: 'YU-' } } } });
  if (badCertificates) throw new Error(`Seed integrity failed: ${badCertificates} certificate serials do not start with YU-.`);
  console.log('Post-seed integrity checks passed:', counts);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
