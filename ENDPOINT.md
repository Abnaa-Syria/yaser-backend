# YASER USMLE STEP 1 — ULTIMATE ENDPOINTS REFERENCE

## Legend
- 🔓 Public
- 🔐 Protected (requires login)
- 👤 Student only
- 👨‍🏫 Instructor only
- 🛡️ Admin only
- 👤👨‍🏫 Student + Instructor

---

## 1. AUTH & RECOVERY
`/api/v1/auth`

| Method | Endpoint                    | Access | Description                                      |
|--------|-----------------------------|--------|--------------------------------------------------|
| POST   | /register                   | 🔓     | تسجيل طالب جديد                                  |
| POST   | /login                      | 🔓     | تسجيل الدخول                                     |
| POST   | /logout                     | 🔐     | تسجيل الخروج + إلغاء الـ Refresh Token           |
| POST   | /refresh                    | 🔓     | تجديد الـ Access Token                           |
| POST   | /forgot-password            | 🔓     | إرسال reset link/token (MVP: returns token)      |
| POST   | /reset-password/:token      | 🔓     | تغيير الباسورد باستخدام الـ token                |
| PATCH  | /change-password            | 🔐     | تغيير الباسورد وأنت logged in                    |

---

## 2. IDENTITY & USER MANAGEMENT
`/api/v1/profile` & `/api/v1/admin/users`

| Method | Endpoint              | Access | Description                                     |
|--------|-----------------------|--------|-------------------------------------------------|
| GET    | /api/v1/profile/me    | 🔐     | جيب بياناتي أنا (مع استبعاد الباسورد - Select)  |
| PATCH  | /api/v1/profile/me    | 🔐     | عدّل بياناتي (fullName, bio, experience...)      |
| GET    | /api/v1/admin/users   | 🛡️     | جيب كل الـ Users (Pagination + Role filter)      |
| GET    | /api/v1/admin/users/:id | 🛡️    | جيب يوزر معين بالتفاصيل                         |
| PATCH  | /api/v1/admin/users/:id | 🛡️    | عدّل يوزر (Admin only)                           |
| DELETE | /api/v1/admin/users/:id | 🛡️    | حذف يوزر (Restrict if has financial history)    |

---

## 3. CURRICULUM (Courses, Lessons, Resources)
`/api/v1/admin/courses`, `/api/v1/admin/lessons`, etc.

| Method | Endpoint                            | Access | Description                                      |
|--------|-------------------------------------|--------|--------------------------------------------------|
| GET    | /api/v1/courses                     | 🔓     | جيب كل الكورسات                                  |
| GET    | /api/v1/courses/:id                 | 🔓     | تفاصيل كورس معين                                 |
| POST   | /api/v1/admin/lessons               | 🛡️     | إنشاء درس (يدعم Video URL, Provider, Duration)  |
| PATCH  | /api/v1/admin/lessons/:id           | 🛡️     | تعديل درس (يدعم تحديث الـ Video fields)          |
| POST   | /api/v1/admin/lessons/:id/resources | 🛡️     | إضافة ملفات/موارد للدرس                          |
| GET    | /api/v1/student/resources/lessons/:id | 👤    | جيب ملفات الدرس (للمشتركين فقط)                 |

---

## 4. LIVE LEARNING & ATTENDANCE
`/api/v1/instructor/classes` & `/api/v1/student/classes`

| Method | Endpoint                                   | Access | Description                                      |
|--------|--------------------------------------------|--------|--------------------------------------------------|
| GET    | /api/v1/student/classes                    | 👤     | الحصص المشترك فيها الطالب                        |
| POST   | /api/v1/student/classes/:id/enroll         | 👤     | انضمام لحصة (Check Capacity logic)               |
| POST   | /api/v1/instructor/classes/:id/attendance | 👨‍🏫     | رصد الحضور والغياب (Bulk Upsert)                |

---

## 5. FINANCIALS, WALLETS & PAYOUTS
`/api/v1/instructor/wallet` & `/api/v1/admin/payouts`

| Method | Endpoint                                  | Access | Description                                      |
|--------|-------------------------------------------|--------|--------------------------------------------------|
| GET    | /api/v1/instructor/wallet                 | 👨‍🏫     | جيب بيانات المحفظة (الرصيد، الأرباح...)          |
| GET    | /api/v1/instructor/wallet/transactions    | 👨‍🏫     | سجل المعاملات المالية (عمولات، سحوبات)            |
| POST   | /api/v1/instructor/wallet/payouts         | 👨‍🏫     | طلب سحب أرباح                                    |
| GET    | /api/v1/admin/payouts                     | 🛡️     | جيب كل طلبات السحب (Pending/All)                 |
| PATCH  | /api/v1/admin/payouts/:id/process         | 🛡️     | معالجة الطلب (Approve/Reject) + Atomic Update     |

---

## 6. ADVANCED CMS & VISIBILITY
`/api/v1/admin/cms` & `/api/v1/public`

| Method | Endpoint                                | Access | Description                                      |
|--------|-----------------------------------------|--------|--------------------------------------------------|
| GET    | /api/v1/public/landing-page             | 🔓     | Power Endpoint: جيب كل داتا الـ Home Page في ريكويست واحد |
| GET    | /api/v1/admin/cms/sections              | 🛡️     | جيب كل الـ Sections الديناميكية                  |
| POST   | /api/v1/admin/cms/sections              | 🛡️     | إنشاء Section جديدة                              |
| DELETE | /api/v1/admin/cms/sections/:id          | 🛡️     | حذف Section                                      |
| GET    | /api/v1/admin/cms/faq                   | 🛡️     | جيب كل الـ FAQs للإدارة                          |
| POST   | /api/v1/admin/cms/faq                   | 🛡️     | إضافة سؤال FAQ جديد                              |
| PATCH  | /api/v1/admin/cms/faq/:id               | 🛡️     | تعديل سؤال FAQ معين                              |
| DELETE | /api/v1/admin/cms/faq/:id               | 🛡️     | حذف سؤال FAQ معين                                |
| GET    | /api/v1/admin/cms/reviews               | 🛡️     | عرض كل الريفيوهات للإدارة                        |
| PATCH  | /api/v1/admin/cms/reviews/:id/feature   | 🛡️     | تمييز ريفيو في الـ Home Page (Social Proof)      |
| PATCH  | /api/v1/admin/cms/reviews/:id/toggle    | 🛡️     | إخفاء/إظهار ريفيو                                |
| GET    | /api/v1/admin/cms/packages              | 🛡️     | عرض كل باقات الاشتراك                            |
| POST   | /api/v1/admin/cms/packages              | 🛡️     | إنشاء باقة جديدة (Full CRUD)                     |
| PATCH  | /api/v1/admin/cms/packages/:id          | 🛡️     | تعديل باقة (Full CRUD)                           |
| PATCH  | /api/v1/admin/cms/packages/:id/status   | 🛡️     | تحديث سريع للـ isActive/isRecommended            |

---

## 7. ENTERPRISE SUPPORT TICKETS
`/api/v1/student/tickets` & `/api/v1/admin/tickets`

| Method | Endpoint                                | Access | Description                                      |
|--------|-----------------------------------------|--------|--------------------------------------------------|
| POST   | /api/v1/student/tickets                 | 👤👨‍🏫  | فتح تيكت دعم فني (Subject, Description, Priority)|
| GET    | /api/v1/student/tickets                 | 👤👨‍🏫  | متابعة تيكتاتي ورؤية ردود الأدمن                |
| POST   | /api/v1/student/tickets/:id/message     | 👤👨‍🏫  | الرد على رسالة الأدمن في التيكت                  |
| GET    | /api/v1/admin/tickets                   | 🛡️     | عرض كل التيكتات (Filter by Status/Priority)      |
| PATCH  | /api/v1/admin/tickets/:id/process       | 🛡️     | معالجة التيكت (Update status + Send Response)     |

---

## 8. NOTIFICATIONS & DASHBOARD
`/api/v1/notifications` & `/api/v1/admin/dashboard`

| Method | Endpoint                        | Access | Description                          |
|--------|---------------------------------|--------|--------------------------------------|
| GET    | /api/v1/notifications           | 🔐     | جيب إشعاراتي (مع الـ Pagination)     |
| PATCH  | /api/v1/notifications/:id/read  | 🔐     | علّم كـ مقروء                        |
| PATCH  | /api/v1/notifications/read-all  | 🔐     | علّم الكل كـ مقروء                   |
| GET    | /api/v1/admin/dashboard/stats   | 🛡️     | إحصائيات (Revenue, Users, Courses)   |

---

## 9. CERTIFICATES & EXAMS
`/api/v1/student/certificates` & `/api/v1/certificates`

| Method | Endpoint                                      | Access | Description                                      |
|--------|-----------------------------------------------|--------|--------------------------------------------------|
| POST   | /student/courses/:courseId/certificates/claim | 👤     | استخراج الشهادة (بعد إتمام 100% من الدروس)       |
| GET    | /certificates/verify/:serialNumber            | 🔓     | بوابة التحقق من صحة الشهادة (Verification Portal)|

---

## 🏗️ SYSTEM ARCHITECTURE HIGHLIGHTS
1. **Security**: Password & Token exclusion via Database-level `select`.
2. **Integrity**: `Restrict` deletions on financial/academic records.
3. **Performance**: Power Endpoints (Landing Page, Dashboard Stats) using Prisma aggregates.
4. **Resilience**: Atomic transactions for Payouts, Enrollments, and Ticket processing.