const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'prisma', 'schema.prisma');
let data = fs.readFileSync(file, 'utf8');

data = data.replace(/\/\/ ============================================\r?\n\/\/ CLASSES \(Live Sessions\)\r?\n\/\/ ============================================\r?\n\r?\nmodel Class \{[\s\S]*?model Enrollment \{[\s\S]*?@@map\("enrollments"\)\r?\n\}/, `// ============================================
// COHORTS & LIVE SESSIONS
// ============================================

model Cohort {
  id            String       @id @default(uuid())
  name          String
  type          CourseType   @default(LIVE)
  status        CohortStatus @default(UPCOMING)
  
  startDate     DateTime?
  endDate       DateTime?
  price         Float
  
  courseId      String
  course        Course       @relation(fields: [courseId], references: [id], onDelete: Cascade)
  
  instructorId  String
  instructor    User         @relation("InstructorCohorts", fields: [instructorId], references: [id])

  // Relations
  enrollments   CohortEnrollment[]
  liveSessions  LiveSession[]
  lessonProgress LessonProgress[]
  cohortReviews CohortReview[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([courseId])
  @@index([instructorId])
  @@map("cohorts")
}

model CohortEnrollment {
  id        String @id @default(uuid())
  
  studentId String
  student   User   @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  cohortId  String
  cohort    Cohort @relation(fields: [cohortId], references: [id], onDelete: Cascade)
  
  joinedAt  DateTime @default(now())
  
  isCompleted           Boolean @default(false)
  completedLessonsCount Int     @default(0)
  progressPercentage    Float   @default(0.0)

  @@unique([cohortId, studentId])
  @@map("cohort_enrollments")
}

model LiveSession {
  id            String            @id @default(uuid())
  title         String?
  description   String?           @db.Text
  type          LiveSessionType   @default(GROUP)
  status        LiveSessionStatus @default(UPCOMING)
  
  startTime     DateTime
  endTime       DateTime
  
  meetingUrl    String? @db.Text
  recordingUrl  String? @db.Text
  
  instructorId  String
  instructor    User    @relation("InstructorLiveSessions", fields: [instructorId], references: [id])

  cohortId      String?
  cohort        Cohort? @relation(fields: [cohortId], references: [id], onDelete: Cascade)

  studentId     String?
  student       User?   @relation("StudentPrivateSessions", fields: [studentId], references: [id], onDelete: Cascade)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([instructorId])
  @@index([cohortId])
  @@index([studentId])
  @@map("live_sessions")
}

model InstructorAvailability {
  id           String             @id @default(uuid())
  
  instructorId String
  instructor   User               @relation("InstructorAvailabilities", fields: [instructorId], references: [id], onDelete: Cascade)
  
  startTime    DateTime
  endTime      DateTime
  
  status       AvailabilityStatus @default(AVAILABLE)

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([instructorId, startTime])
  @@map("instructor_availabilities")
}`);

data = data.replace(/\/\/ Ø±ÙŠÙ ÙŠÙˆ Ø¹Ù„Ù‰ Ø§Ù„Ù€ Class\r?\nmodel ClassReview \{[\s\S]*?@@map\("class_reviews"\)\r?\n\}/, `// Ø±ÙŠÙ ÙŠÙˆ Ø¹Ù„Ù‰ Ø§Ù„Ù€ Cohort
model CohortReview {
  id        String @id @default(uuid())
  cohortId  String
  cohort    Cohort @relation(fields: [cohortId], references: [id], onDelete: Cascade)

  studentId String
  student   User   @relation(fields: [studentId], references: [id], onDelete: Cascade)

  rating  Int     @default(5)
  comment String? @db.Text

  isVisible        Boolean @default(true)
  isFeaturedOnHome Boolean @default(false)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([cohortId, studentId])
  @@map("cohort_reviews")
}`);

data = data.replace(/\/\/ 3\. Ù„Ùˆ Ø§Ù„Ø¯Ù Ø¹ Ù„Ø­ØµØ© Ù…Ù†Ù Ø±Ø¯Ø© \(Ø®Ø§Ø±Ø¬ Ø§Ù„Ø¨Ø§Ù‚Ø©\)\r?\n  classId String\?\r?\n  class   Class\?  @relation\(fields: \[classId\], references: \[id\], onDelete: SetNull\)/, `// 3. Ù„Ùˆ Ø§Ù„Ø¯Ù Ø¹ Ù„ÙƒÙˆÙ‡ÙˆØ±Øª Ù…Ù†Ù ØµÙ„
  cohortId String?
  cohort   Cohort?  @relation(fields: [cohortId], references: [id], onDelete: SetNull)`);

fs.writeFileSync(file, data, 'utf8');
console.log('Done!');
