/**
 * Production repair: RBAC event:manage, site/trial settings, Arabic content.
 * Run: node --experimental-strip-types OR npx tsx scripts/repair-production.mjs
 */
const BASE = 'https://api.alienparts.online/api/v1';
const SITE = 'https://www.alienparts.online';

async function api(method, path, token, body) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const init = { method, headers };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json; charset=utf-8';
    init.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, init);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status} ${text.slice(0, 400)}`);
  }
  return { code: res.status, json, text };
}

function rolePerms(role) {
  return (role.permissions || []).map((p) => {
    if (typeof p === 'string') return p;
    if (p?.permission?.action) return p.permission.action;
    if (p?.action) return p.action;
    return null;
  }).filter(Boolean);
}

function looksBrokenAr(value) {
  if (!value || typeof value !== 'string') return true;
  if (/^[\s?؟�.]+$/u.test(value.trim())) return true;
  const q = (value.match(/\?/g) || []).length;
  return q >= 3 && !/[\u0600-\u06FF]/.test(value);
}

async function main() {
  const login = await api('POST', '/auth/login', null, {
    identifier: 'superadmin@yaserusmle.com',
    password: 'Password123!',
    deviceName: 'Cursor prod repair',
  });
  const token = login.json.data.tokens.accessToken;
  console.log('Logged in as', login.json.data.user.role.name);

  // 1) event:manage
  const roles = await api('GET', '/admin/roles', token);
  for (const role of roles.json.data || []) {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(role.name)) continue;
    const perms = new Set(rolePerms(role));
    perms.add('event:manage');
    const updated = await api('PUT', `/admin/roles/${role.id}/permissions`, token, {
      permissions: [...perms],
    });
    const next = rolePerms(updated.json.data);
    console.log(`Role ${role.name}: ${next.length} perms, event:manage=${next.includes('event:manage')}`);
  }

  const events = await api('GET', '/admin/events', token);
  const eventList = events.json.data?.events || events.json.data || [];
  console.log('Admin events OK:', events.code, 'count=', eventList.length);

  // 2) Site settings
  await api('PATCH', '/admin/settings', token, {
    SITE_NAME: 'Yaser USMLE',
    CONTACT_EMAIL: 'hello@yaserusmle.com',
    PHONE_NUMBER: '+201159007543',
    SUPPORT_PHONE: '+201159007543',
    LOGO_PRIMARY_URL: `${SITE}/assets/brand/logo-primary.svg`,
    LOGO_LIGHT_URL: `${SITE}/assets/brand/logo-light.svg`,
    LOGO_MARK_URL: `${SITE}/assets/brand/logo-mark.svg`,
    SOCIAL_INSTAGRAM_URL: 'https://www.instagram.com/yaserusmle',
    SOCIAL_TWITTER_URL: 'https://x.com/yaserusmle',
    SOCIAL_FACEBOOK_URL: 'https://www.facebook.com/yaserusmle',
    SOCIAL_LINKEDIN_URL: 'https://www.linkedin.com/company/yaserusmle',
  });
  const pub = await api('GET', '/public/settings', null);
  console.log('Public settings:', {
    phone: pub.json.data.phoneNumber,
    logo: pub.json.data.logoPrimaryUrl,
    email: pub.json.data.contactEmail,
    ig: pub.json.data.social?.instagram,
  });

  // 3) Trial
  const trialSettings = await api('PATCH', '/admin/trial/settings', token, {
    enabled: true,
    durationDays: 3,
    popupEnabled: true,
    title: 'Try Yaser USMLE free',
    titleAr: 'جرّب ياسر USMLE مجاناً',
    subtitle: 'Explore selected courses without creating an account.',
    subtitleAr: 'استكشف كورسات مختارة بدون إنشاء حساب.',
    ctaLabel: 'Start free trial',
    ctaLabelAr: 'ابدأ التجربة المجانية',
    dismissDays: 7,
  });
  console.log('Trial titleAr:', trialSettings.json.data?.settings?.titleAr || trialSettings.json.data?.titleAr);

  const coursesRes = await api('GET', '/admin/courses?limit=50', token);
  const clist = coursesRes.json.data?.courses || coursesRes.json.data || [];
  const pick = (...preds) => {
    for (const pred of preds) {
      const found = clist.find(pred);
      if (found) return found;
    }
    return null;
  };
  const picks = [
    pick((c) => /Free Trial/i.test(c.title)),
    pick((c) => /Hematology/i.test(c.title)),
    pick((c) => /Cardiovascular Physiology/i.test(c.title)),
    pick((c) => /Advanced Research/i.test(c.title)),
  ].filter(Boolean);
  const seen = new Set();
  const trialIds = [];
  for (const c of picks) {
    if (!seen.has(c.id)) {
      seen.add(c.id);
      trialIds.push(c.id);
    }
  }
  const selected = trialIds.slice(0, 3);
  await api('PUT', '/admin/trial/courses', token, {
    courses: selected.map((courseId, i) => ({
      courseId,
      displayOrder: i + 1,
      isActive: true,
    })),
  });
  console.log('Trial courses:', selected);

  const trialPublic = await api('GET', '/public/trial', null);
  console.log('Public trial:', {
    enabled: trialPublic.json.data.enabled,
    titleAr: trialPublic.json.data.titleAr,
  });

  // 4) Arabic CMS
  await api('PATCH', '/admin/cms/hero', token, {
    headline: {
      en: 'Understand Step 1. Do not just memorize it.',
      ar: 'افهم Step 1 ولا تكتفِ بالحفظ.',
    },
    subheadline: {
      en: 'Bilingual mechanism-first teaching and board-style practice.',
      ar: 'شرح ثنائي اللغة قائم على الفهم وتدريب بنمط البورد.',
    },
    isVisible: true,
  });
  await api('PATCH', '/admin/cms/about-us', token, {
    mission: {
      en: 'Make high-quality Step 1 teaching accessible to Arabic-speaking medical learners.',
      ar: 'إتاحة تعليم Step 1 عالي الجودة لطلاب الطب الناطقين بالعربية.',
    },
    vision: {
      en: 'Confident clinical reasoning built from strong foundations.',
      ar: 'استدلال سريري واثق مبني على أسس قوية.',
    },
    description: {
      en: 'Yaser USMLE helps learners master mechanisms, not memorization.',
      ar: 'ياسر USMLE يساعد الطلاب على إتقان الآليات لا الحفظ فقط.',
    },
  });
  console.log('Hero + About Arabic updated');

  const packageFixes = [
    {
      id: 'dd7be974-20da-4d05-b5e4-29e9e5531d97',
      titleAr: 'حزمة أنظمة Step 1 الأساسية',
      shortDescriptionAr: 'مراجعة القلب والكلى وعلوم الأعصاب.',
      descriptionAr: 'تحضير متكامل لأجهزة الجسم بدروس ثنائية اللغة.',
    },
    {
      id: 'bfdc149e-de4f-4de5-b251-246e1f83ca0d',
      titleAr: 'مسرّع الأسس العلمية',
      shortDescriptionAr: 'الأحياء الدقيقة والمناعة والكيمياء الحيوية.',
      descriptionAr: 'أساسيات العلوم قبل الأنظمة لمسار Step 1.',
    },
  ];
  for (const pkg of packageFixes) {
    const { id, ...body } = pkg;
    try {
      const r = await api('PATCH', `/admin/financials/packages/${id}`, token, body);
      console.log('Package', id, 'titleAr=', r.json.data?.titleAr);
    } catch (err) {
      console.warn(String(err));
    }
  }

  for (const event of eventList) {
    if (!looksBrokenAr(event.titleAr) && !looksBrokenAr(event.descriptionAr)) {
      console.log('Event OK', event.id);
      continue;
    }
    const isQuestion = /Question Review/i.test(event.titleEn || '');
    await api('PATCH', `/admin/events/${event.id}`, token, {
      titleAr: isQuestion ? 'ليلة مراجعة أسئلة Step 1' : 'ورشة تخطيط المذاكرة',
      descriptionAr: isQuestion
        ? 'مراجعة مجتمعية مباشرة لأسئلة تكاملية عالية العائد.'
        : 'أنشئ جدولاً واقعياً لمراجعة الأجهزة خلال ثمانية أسابيع.',
    });
    console.log('Event Arabic fixed', event.id);
  }

  // Seed-course Arabic titles (requires deployed titleAr support — attempt anyway)
  const seedCourseArabic = {
    '2de7d80c-d18c-470e-8c4c-6ed2218bbf5e': {
      titleAr: 'فسيولوجيا وأمراض القلب والأوعية',
      shortDescriptionAr: 'مراجعة مركزة وعالية العائد في فسيولوجيا وأمراض القلب والأوعية.',
    },
    '36232e2f-25f8-4600-9a50-f0085cbea0e7': {
      titleAr: 'فسيولوجيا الكلى والتوازن الحمضي القاعدي',
      shortDescriptionAr: 'مراجعة مركزة وعالية العائد في فسيولوجيا الكلى والتوازن الحمضي القاعدي.',
    },
    'dcf7c326-957a-445a-9d73-1886086a0d89': {
      titleAr: 'علوم الأعصاب والعلوم السلوكية',
      shortDescriptionAr: 'مراجعة مركزة وعالية العائد في علوم الأعصاب والعلوم السلوكية.',
    },
    '2795bcf5-b4b3-4a21-bc8f-ef7aa68b3cbe': {
      titleAr: 'الأحياء الدقيقة ومضادات الميكروبات',
      shortDescriptionAr: 'مراجعة مركزة وعالية العائد في الأحياء الدقيقة ومضادات الميكروبات.',
    },
    'eba385f2-440b-4cd4-ae51-7c6ca33cabee': {
      titleAr: 'مراجعة المناعة عالية العائد',
      shortDescriptionAr: 'مراجعة مركزة وعالية العائد في المناعة.',
    },
  };
  for (const [id, body] of Object.entries(seedCourseArabic)) {
    try {
      const r = await api('PATCH', `/admin/courses/${id}`, token, body);
      console.log('Course Arabic', id, '->', r.code, r.json.data?.titleAr || r.json.message);
    } catch (err) {
      console.warn('Course Arabic skipped (needs deploy for titleAr fields):', String(err).slice(0, 180));
    }
  }

  // Verify landing Arabic
  const landing = await api('GET', '/public/landing-page', null);
  const hero = (landing.json.data?.sections || []).find((s) => s.key === 'HERO');
  const heroAr = hero?.content?.headline?.ar || hero?.content?.headline;
  console.log('Hero AR check:', heroAr);
  console.log('Hero AR has Arabic letters:', /[\u0600-\u06FF]/.test(String(heroAr || '')));

  const pkgs = await api('GET', '/packages', null);
  for (const p of pkgs.json.data || []) {
    console.log('Package', p.slug, 'titleAr=', p.titleAr, 'ok=', /[\u0600-\u06FF]/.test(p.titleAr || ''));
  }

  const trialAdmin = await api('GET', '/admin/trial', token);
  console.log('Trial courses count:', (trialAdmin.json.data?.courses || []).length);

  console.log('DONE');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
