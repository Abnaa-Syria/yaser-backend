# Yaser USMLE Step 1 — Backend

API للمنصة مبني بـ **Node.js + Express + TypeScript + Prisma + MySQL**.

## المتطلبات

- [Node.js](https://nodejs.org/) 18 أو أحدث
- [MySQL](https://www.mysql.com/) 8 (محلي أو Docker)
- npm

## التشغيل السريع

### 1) إعداد البيئة

من مجلد `backend`:

```bash
copy .env.example .env
```

عدّل `DATABASE_URL` في `.env` حسب إعدادات MySQL عندك.

### 2) إنشاء قاعدة البيانات

أنشئ قاعدة بيانات فارغة (مرة واحدة):

```sql
CREATE DATABASE `yaser-usmle-step1` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3) تثبيت الحزم

```bash
npm install
```

### 4) تجهيز Prisma والبيانات

```bash
npm run prisma:generate
npm run db:push
npm run db:seed
```

- `db:push` — ينشئ/يحدّث الجداول من `prisma/schema.prisma`
- `db:seed` — يملأ قاعدة البيانات ببيانات تجريبية للداشبورد

### ترقية من نموذج Cohorts (قواعد بيانات قديمة)

```bash
npx tsx prisma/migrations-data/cohort-to-course.ts
npm run db:push
npm run db:seed
```

## نموذج الأعمال (الحالي)

| المفهوم | الوصف |
|---------|--------|
| **Course.type** | `HYBRID` (لايف + تسجيلات) أو `RECORDED` |
| **الشراء** | `POST /student/financials/checkout/course/:courseId` → `CoursePurchase` مدى الحياة |
| **الجلسات** | `LiveSession` مربوطة بـ `courseId` — للـ HYBRID فقط |
| **العمولة** | تُوزَّع على مدرسي المحتوى والسيشنات عند موافقة الدفع |
| **Private 1-on-1** | `POST /student/financials/checkout/private/:availabilityId` |

الباكدجات/الاشتراكات (`SubscriptionPlan`) متوقفة مؤقتاً — الوصول عبر شراء الكورس فقط.

### 5) تشغيل السيرفر

```bash
npm run dev
```

السيرفر يشتغل على: **http://localhost:3000**

تحقق من الصحة:

- `GET http://localhost:3000/api/health`

## أوامر مفيدة

| الأمر | الوظيفة |
|--------|---------|
| `npm run dev` | تشغيل التطوير (hot reload) |
| `npm run build` | بناء TypeScript → `dist/` |
| `npm start` | تشغيل النسخة المبنية |
| `npm run db:push` | مزامنة الـ schema مع MySQL |
| `npm run db:seed` | إعادة ملء البيانات التجريبية |
| `npm run db:studio` | واجهة Prisma Studio لقاعدة البيانات |

## متغيرات البيئة (`.env`)

| المتغير | مطلوب | الوصف |
|---------|--------|--------|
| `DATABASE_URL` | نعم | رابط اتصال MySQL |
| `PORT` | لا | منفذ السيرفر (افتراضي: `3000`) |
| `NODE_ENV` | لا | `development` أو `production` |
| `JWT_SECRET` | نعم | مفتاح توقيع access token |
| `JWT_REFRESH_SECRET` | نعم | مفتاح توقيع refresh token |
| `JWT_EXPIRE` | لا | مدة صلاحية الـ token (افتراضي: `1d`) |
| `ALLOWED_ORIGINS` | لا | دومينات الفرونت المسموح بها (CORS) |

مثال `DATABASE_URL`:

```
mysql://USER:PASSWORD@localhost:3306/yaser-usmle-step1
```

مثال `ALLOWED_ORIGINS` (لازم يشمل منفذ Vite):

```
http://localhost:5173,http://127.0.0.1:5173
```

## حسابات تجريبية (بعد الـ seed)

كل الحسابات بنفس كلمة المرور: **`Password123!`**

راجع `prisma/seed.ts` لمعرفة معرّفات تسجيل الدخول التي تنشئها بيانات التطوير الحالية.

## هيكل المشروع (مختصر)

```
backend/
├── prisma/
│   ├── schema.prisma   # نموذج قاعدة البيانات
│   └── seed.ts         # بيانات تجريبية
├── src/
│   ├── modules/        # منطق الأعمال (auth, admin, ...)
│   ├── middlewares/
│   ├── config/
│   └── server.ts       # نقطة الدخول
└── .env                # إعدادات محلية (مش في Git)
```

## مشاكل شائعة

**خطأ اتصال MySQL**
- تأكد إن MySQL شغال
- راجع `DATABASE_URL` (المستخدم، الباسورد، اسم القاعدة)

**CORS من الفرونت**
- أضف منفذ Vite في `ALLOWED_ORIGINS`

**بعد تعديل `schema.prisma`**
```bash
npm run prisma:generate
npm run db:push
```
